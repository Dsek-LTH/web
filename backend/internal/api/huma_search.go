package api

import (
	"context"
	"crypto/subtle"
	"errors"
	"io"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/search"
)

type searchInput struct {
	Query   string   `query:"query"           required:"true" minLength:"1"`
	Indexes []string `query:"indexes,explode" required:"true"               enum:"members,events,articles,positions,songs,committees,governingDocuments,meetingDocuments"`
	Limit   int      `query:"limit"                                                                                                                                       default:"20" minimum:"-1" maximum:"100"`
	Offset  int      `query:"offset"                                                                                                                                      default:"0"  minimum:"0"`
}

type searchOutput struct {
	Body []search.Hit
}

func searchError(err error) error {
	switch {
	case errors.Is(err, search.ErrInvalidInput):
		return huma.Error400BadRequest(err.Error())
	case errors.Is(err, search.ErrUnavailable):
		return huma.Error503ServiceUnavailable("search is not configured")
	case errors.Is(err, search.ErrSyncRunning):
		return huma.Error409Conflict("a search sync is already running")
	default:
		return humaServiceError(err)
	}
}

func registerSearchRoutes(api huma.API, svc *search.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "search",
		Method:      http.MethodGet,
		Path:        "/search",
		Summary:     "Search across several indexes at once",
		Description: "The members index is only searched for a signed-in caller.",
	}, func(ctx context.Context, input *searchInput) (*searchOutput, error) {
		hits, err := svc.Search(ctx, search.Query{
			Query:   input.Query,
			Indexes: input.Indexes,
			Limit:   input.Limit,
			Offset:  input.Offset,
		})
		if err != nil {
			return nil, searchError(err)
		}
		return &searchOutput{Body: hits}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "start-search-sync",
		Method:        http.MethodPost,
		Path:          "/search/sync",
		Summary:       "Rebuild every search index in the background",
		DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, input *struct{}) (*struct{}, error) {
		if err := svc.StartSync(ctx); err != nil {
			return nil, searchError(err)
		}
		return nil, nil
	})
}

// SearchSyncPasswordHandler starts a rebuild for a caller holding
// SYNC_PASSWORD (sent as the raw request body) rather than a session - the
// old POST /api/sync, which SvelteKit still serves at that URL as a proxy
// to this one for whatever external job calls it. An empty password never
// matches.
func SearchSyncPasswordHandler(svc *search.Service, password string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(io.LimitReader(r.Body, 1024))
		if err != nil || password == "" ||
			subtle.ConstantTimeCompare(body, []byte(password)) != 1 {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		switch err := svc.StartSyncUnchecked(); {
		case errors.Is(err, search.ErrUnavailable):
			http.Error(w, "search is not configured", http.StatusServiceUnavailable)
		case errors.Is(err, search.ErrSyncRunning):
			http.Error(w, "a search sync is already running", http.StatusConflict)
		case err != nil:
			http.Error(w, "internal error", http.StatusInternalServerError)
		default:
			w.WriteHeader(http.StatusAccepted)
		}
	}
}
