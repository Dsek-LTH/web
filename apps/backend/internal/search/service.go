// Package search is the cross-entity search over Meilisearch: a full
// rebuild of every index from the database (and the meeting-document
// bucket), and a federated query across the indexes a caller picks.
// Ported from src/lib/search/* and src/routes/(app)/api/search.
package search

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/dsek-lth/web/apps/backend/internal/auth"
	"github.com/dsek-lth/web/apps/backend/internal/db"
	"github.com/dsek-lth/web/apps/backend/internal/locale"
	"github.com/dsek-lth/web/apps/backend/internal/storage"
)

var (
	ErrInvalidInput = errors.New("search: invalid input")
	// ErrUnavailable means Meilisearch isn't configured.
	ErrUnavailable = errors.New("search: unavailable")
	// ErrSyncRunning means a rebuild is already in progress.
	ErrSyncRunning = errors.New("search: sync already running")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Config struct {
	MeiliHost      string
	MeiliAPIKey    string
	PopplerURL     string
	DocumentBucket string
}

type Service struct {
	queries        *db.Queries
	meili          *meiliClient
	poppler        *popplerClient
	store          storage.Backend
	documentBucket string
	syncMu         sync.Mutex
}

// NewService returns a Service; with no MeiliHost, every call returns
// ErrUnavailable instead of failing at startup (the old app also only
// failed when search was first used).
func NewService(pool *pgxpool.Pool, store storage.Backend, cfg Config) *Service {
	s := &Service{
		queries:        db.New(pool),
		store:          store,
		documentBucket: cfg.DocumentBucket,
	}
	if cfg.MeiliHost != "" {
		s.meili = newMeiliClient(cfg.MeiliHost, cfg.MeiliAPIKey)
	}
	s.poppler = &popplerClient{url: strings.TrimSuffix(cfg.PopplerURL, "/"), http: s.httpClient()}
	return s
}

// Hit is one search result: the index it came from and the stored
// document, with long strings truncated.
type Hit struct {
	Type string         `json:"type"`
	Data map[string]any `json:"data"`
}

type Query struct {
	Query   string
	Indexes []string
	Limit   int
	Offset  int
}

// maxLimit caps how many hits one request may ask for.
const maxLimit = 100

// truncateAt is how many characters of each (non-link) string field a hit
// carries, to keep responses small.
const truncateAt = 60

// Search runs one federated query across q.Indexes. The members index
// needs a signed-in caller - like the member directory itself - and is
// silently left out otherwise; the old endpoint let anyone search members.
func (s *Service) Search(ctx context.Context, q Query) ([]Hit, error) {
	if s.meili == nil {
		return nil, ErrUnavailable
	}
	if strings.TrimSpace(q.Query) == "" {
		return nil, invalidf("query is required")
	}
	if len(q.Indexes) == 0 {
		return nil, invalidf("at least one index is required")
	}
	limit := q.Limit
	if limit <= 0 {
		limit = 20
	}
	limit = min(limit, maxLimit)
	offset := max(q.Offset, 0)

	identity, ok := auth.FromContext(ctx)
	signedIn := ok && identity.MemberID != ""
	lang := locale.FromContext(ctx)

	req := multiSearchRequest{}
	req.Federation.Limit = limit
	req.Federation.Offset = offset
	seen := map[string]bool{}
	for _, index := range q.Indexes {
		def, ok := indexDefs[index]
		if !ok {
			return nil, invalidf("unknown index %q", index)
		}
		if seen[index] || (index == IndexMembers && !signedIn) {
			continue
		}
		seen[index] = true
		attrs, ok := def.searchOn[lang]
		if !ok {
			attrs = def.searchOn["sv"]
		}
		req.Queries = append(req.Queries, federatedQuery{
			IndexUID:             index,
			Q:                    q.Query,
			AttributesToSearchOn: attrs,
			FederationOptions:    federationOptions{Weight: def.weight},
		})
	}
	if len(req.Queries) == 0 {
		return []Hit{}, nil
	}

	res, err := s.meili.multiSearch(ctx, req)
	if err != nil {
		return nil, err
	}
	hits := make([]Hit, 0, len(res.Hits))
	for _, raw := range res.Hits {
		hits = append(hits, toHit(raw, lang))
	}
	return hits, nil
}

// toHit shapes one raw Meilisearch hit the way the old /api/search did:
// for English, every fooEn field that is set is also exposed as foo; every
// string that isn't used as a link is cut to truncateAt characters.
// Meilisearch's own underscore-prefixed fields are dropped, apart from
// reading the index name out of _federation, and so are null fields (at
// any depth), so an unset field is absent like everywhere else in the API.
func toHit(raw map[string]any, lang string) Hit {
	var index string
	if fed, ok := raw["_federation"].(map[string]any); ok {
		index, _ = fed["indexUid"].(string)
	}
	data := map[string]any{}
	for key, value := range raw {
		if !strings.HasPrefix(key, "_") {
			data[key] = value
		}
	}
	if lang == "en" {
		for key, value := range raw {
			if base, ok := strings.CutSuffix(key, "En"); ok && base != "" && value != nil {
				data[base] = value
			}
		}
	}
	dropNulls(data)
	for key, value := range data {
		if str, ok := value.(string); ok && !linkAttributes[key] {
			data[key] = truncate(str, truncateAt)
		}
	}
	return Hit{Type: index, Data: data}
}

// dropNulls removes null fields from m and from any objects nested in it.
func dropNulls(m map[string]any) {
	for key, value := range m {
		switch v := value.(type) {
		case nil:
			delete(m, key)
		case map[string]any:
			dropNulls(v)
		}
	}
}

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n])
}

// ValidIndex reports whether name is one of Indexes.
func ValidIndex(name string) bool {
	return slices.Contains(Indexes, name)
}
