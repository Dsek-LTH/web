package documents

import (
	"context"
	"path"
	"slices"
	"strings"
	"sync"

	"golang.org/x/text/collate"
	"golang.org/x/text/language"

	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/storage"
)

// The words that make a file a meeting's notice, agenda or minutes,
// anywhere in its name ("2026-10-07-srd19-notice.pdf",
// "1_Fredragningslista_VTM.pdf"), case-insensitively.
var (
	noticeWords = []string{"kallelse", "notice"}
	agendaWords = []string{
		"föredragningslista",
		"foredragningslista",
		"fredragningslista",
		"dagordning",
		"agenda",
	}
	minutesWords = []string{"protokoll", "minutes", "minute", "protocol"}
)

// bucketFile is a listed object and the bucket it's in.
type bucketFile struct {
	storage.Object
	bucket string
}

// meetingFiles is one meeting's files while they're collected: all of them
// in listing order, and by group ("" for none).
type meetingFiles struct {
	files  []bucketFile
	groups map[string][]bucketFile
}

// groupOptions are groupDocuments' variations for the SRD files bucket.
type groupOptions struct {
	// oldSRDFormat keeps files outside a valid meeting folder, as meetings
	// named after the file: SRD files from before the folder convention.
	oldSRDFormat bool
	// meetingFilter, when set, decides which folders are meetings.
	meetingFilter func(meeting string) bool
}

// meetingOf returns the meeting a key belongs to below base: the first
// folder, if the file is inside one (any deeper folders are from an older
// layout and don't matter).
func meetingOf(key, base string) (string, bool) {
	rest, ok := strings.CutPrefix(key, base)
	if !ok {
		return "", false
	}
	var parts []string
	for _, p := range strings.Split(rest, "/") {
		if p != "" {
			parts = append(parts, p)
		}
	}
	if len(parts) < 2 {
		return "", false
	}
	return parts[0], true
}

// meetingFileKey is a key's path inside its meeting folder: its key in the
// folder's sidecar.
func meetingFileKey(key, folder string) string {
	return strings.TrimPrefix(key, strings.TrimSuffix(folder, "/")+"/")
}

// meetingFolder returns the meeting folder a file is in:
// public/{year}/{meeting} in the documents bucket,
// public/srd/{year}/{meeting} in the files bucket.
func (s *Service) meetingFolder(bucket, key string) (string, bool) {
	parts := strings.Split(key, "/")
	if parts[len(parts)-1] == "" {
		return "", false
	}
	folder := parts[:len(parts)-1]
	switch bucket {
	case s.documentsBucket:
		if len(folder) < 3 || folder[0] != "public" {
			return "", false
		}
		return strings.Join(folder[:3], "/"), true
	case s.filesBucket:
		if len(folder) < 4 || folder[0] != "public" || folder[1] != "srd" {
			return "", false
		}
		return strings.Join(folder[:4], "/"), true
	}
	return "", false
}

// listFiles lists a bucket's files below prefix, without folders and
// sidecars.
func (s *Service) listFiles(ctx context.Context, bucket, prefix string) ([]bucketFile, error) {
	objects, err := s.store.List(ctx, bucket, prefix, true)
	if err != nil {
		return nil, err
	}
	files := make([]bucketFile, 0, len(objects))
	for _, o := range objects {
		if o.IsDir || isReservedName(o.Name) {
			continue
		}
		files = append(files, bucketFile{Object: o, bucket: bucket})
	}
	return files, nil
}

// groupDocuments collects files below base into meetings, each file in the
// group its meeting's sidecar gives it.
func (s *Service) groupDocuments(
	ctx context.Context,
	bucket string,
	files []bucketFile,
	base string,
	opts groupOptions,
) map[string]*meetingFiles {
	meetingNames := make([]string, len(files))
	var folders []string
	for i, f := range files {
		meeting, ok := meetingOf(f.Key, base)
		if ok && opts.meetingFilter != nil && !opts.meetingFilter(meeting) {
			ok = false
		}
		if ok {
			meetingNames[i] = meeting
			if !slices.Contains(folders, meeting) {
				folders = append(folders, meeting)
			}
		}
	}
	groupMaps := s.readGroupMaps(ctx, bucket, base, folders)

	meetings := map[string]*meetingFiles{}
	for i, f := range files {
		meeting, group := meetingNames[i], ""
		if meeting != "" {
			group = groupMaps[meeting][meetingFileKey(f.Key, base+meeting)]
		} else if opts.oldSRDFormat {
			meeting = strings.TrimSuffix(f.Name, path.Ext(f.Name))
		} else {
			continue
		}
		m, ok := meetings[meeting]
		if !ok {
			m = &meetingFiles{groups: map[string][]bucketFile{}}
			meetings[meeting] = m
		}
		m.files = append(m.files, f)
		m.groups[group] = append(m.groups[group], f)
	}
	return meetings
}

// readGroupMaps reads the sidecars of the given meeting folders below base
// in parallel.
func (s *Service) readGroupMaps(
	ctx context.Context,
	bucket, base string,
	folders []string,
) map[string]groupMap {
	maps := make([]groupMap, len(folders))
	var wg sync.WaitGroup
	for i, folder := range folders {
		wg.Go(func() { maps[i] = s.readGroupMap(ctx, bucket, base+folder) })
	}
	wg.Wait()
	byFolder := make(map[string]groupMap, len(folders))
	for i, folder := range folders {
		byFolder[folder] = maps[i]
	}
	return byFolder
}

// mergeMeetings adds src's meetings to dst, joining same-named meetings and
// groups.
func mergeMeetings(dst, src map[string]*meetingFiles) {
	for name, m := range src {
		existing, ok := dst[name]
		if !ok {
			dst[name] = m
			continue
		}
		existing.files = append(existing.files, m.files...)
		for group, files := range m.groups {
			existing.groups[group] = append(existing.groups[group], files...)
		}
	}
}

// meetingList turns collected meetings into the response: meetings, groups
// (named ones first) and files sorted by name the Swedish way, and the
// caller's permissions on each file.
func (s *Service) meetingList(ctx context.Context, meetings map[string]*meetingFiles) []Meeting {
	col := collate.New(language.Swedish)
	byName := func(a, b string) int { return col.CompareString(a, b) }
	identity, _ := auth.FromContext(ctx)
	doc := func(f bucketFile) MeetingDocument {
		update, del := s.bucketPolicies(f.bucket)
		return MeetingDocument{
			ID:           f.Key,
			Name:         f.Name,
			URL:          f.URL,
			Size:         f.Size,
			LastModified: f.LastModified,
			CanEdit:      identity != nil && identity.Has(update),
			CanDelete:    identity != nil && identity.Has(del),
		}
	}
	latest := func(files []bucketFile, words []string) *MeetingDocument {
		var best *bucketFile
		for i := range files {
			name := strings.ToLower(files[i].Name)
			if !slices.ContainsFunc(
				words,
				func(w string) bool { return strings.Contains(name, w) },
			) {
				continue
			}
			// On a tie the later file wins, as in the old app.
			if best == nil || !files[i].LastModified.Before(best.LastModified) {
				best = &files[i]
			}
		}
		if best == nil {
			return nil
		}
		d := doc(*best)
		return &d
	}

	names := make([]string, 0, len(meetings))
	for name := range meetings {
		names = append(names, name)
	}
	slices.SortFunc(names, byName)

	list := make([]Meeting, 0, len(names))
	for _, name := range names {
		m := meetings[name]
		groupNames := make([]string, 0, len(m.groups))
		for g := range m.groups {
			groupNames = append(groupNames, g)
		}
		slices.SortFunc(groupNames, func(a, b string) int {
			switch {
			case a == "":
				return 1
			case b == "":
				return -1
			}
			return byName(a, b)
		})
		groups := make([]MeetingDocumentGroup, 0, len(groupNames))
		for _, g := range groupNames {
			files := slices.Clone(m.groups[g])
			slices.SortStableFunc(
				files,
				func(a, b bucketFile) int { return byName(a.Name, b.Name) },
			)
			docs := make([]MeetingDocument, len(files))
			for i, f := range files {
				docs[i] = doc(f)
			}
			groups = append(groups, MeetingDocumentGroup{Name: g, Files: docs})
		}
		list = append(list, Meeting{
			Name:    name,
			Notice:  latest(m.files, noticeWords),
			Agenda:  latest(m.files, agendaWords),
			Minutes: latest(m.files, minutesWords),
			Groups:  groups,
		})
	}
	return list
}
