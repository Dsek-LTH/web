package documents

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"sync"

	"github.com/dsek-lth/web/apps/api/internal/storage"
)

// groupsFile is each meeting folder's sidecar, mapping a file's path in the
// folder to its group: {"version": 1, "files": {"Motion.pdf": "Motion 1"}}.
// The format is the old SvelteKit app's (src/lib/files/documentGroups.ts),
// so sidecars it wrote keep working.
const groupsFile = "_groups.json"

func isReservedName(name string) bool { return name == groupsFile }

// groupMap maps a file's path in its meeting folder to its group.
type groupMap map[string]string

type sidecar struct {
	Version int            `json:"version"`
	Files   map[string]any `json:"files"`
}

func groupsKey(folder string) string {
	return strings.TrimSuffix(folder, "/") + "/" + groupsFile
}

// loadGroupMap reads a meeting folder's sidecar; a missing one is empty.
// Any other error is returned, so an update never overwrites a sidecar it
// couldn't read.
func (s *Service) loadGroupMap(ctx context.Context, bucket, folder string) (groupMap, error) {
	data, err := s.store.Get(ctx, bucket, groupsKey(folder))
	if errors.Is(err, storage.ErrNotFound) {
		return groupMap{}, nil
	}
	if err != nil {
		return nil, err
	}
	var sc sidecar
	if err := json.Unmarshal(data, &sc); err != nil {
		return nil, err
	}
	groups := groupMap{}
	for name, group := range sc.Files {
		if g, ok := group.(string); ok && strings.TrimSpace(g) != "" {
			groups[name] = strings.TrimSpace(g)
		}
	}
	return groups, nil
}

// readGroupMap is loadGroupMap for listings: a sidecar that can't be read
// leaves the meeting's files ungrouped rather than failing the page.
func (s *Service) readGroupMap(ctx context.Context, bucket, folder string) groupMap {
	groups, err := s.loadGroupMap(ctx, bucket, folder)
	if err != nil {
		slog.Error("documents: read groups", "bucket", bucket, "folder", folder, "err", err)
		return groupMap{}
	}
	return groups
}

// updateGroupMap applies mutate to a meeting folder's sidecar and writes it
// back if mutate reports a change. Updates to one sidecar run one at a
// time; that's enough because the API runs as a single replica.
func (s *Service) updateGroupMap(
	ctx context.Context,
	bucket, folder string,
	mutate func(groupMap) bool,
) error {
	lock := s.sidecarLock(bucket + "/" + folder)
	lock.Lock()
	defer lock.Unlock()

	groups, err := s.loadGroupMap(ctx, bucket, folder)
	if err != nil {
		return err
	}
	if !mutate(groups) {
		return nil
	}
	body, err := json.MarshalIndent(struct {
		Version int      `json:"version"`
		Files   groupMap `json:"files"`
	}{1, groups}, "", "  ")
	if err != nil {
		return err
	}
	_, err = s.store.Put(ctx, bucket, groupsKey(folder), bytes.NewReader(body), int64(len(body)))
	return err
}

func (s *Service) sidecarLock(id string) *sync.Mutex {
	s.locksMu.Lock()
	defer s.locksMu.Unlock()
	if s.locks == nil {
		s.locks = map[string]*sync.Mutex{}
	}
	lock, ok := s.locks[id]
	if !ok {
		lock = &sync.Mutex{}
		s.locks[id] = lock
	}
	return lock
}
