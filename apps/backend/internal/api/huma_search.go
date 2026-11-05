package api

import (
	"context"
	"crypto/subtle"
	"errors"
	"io"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/search"
)

func registerSearchRoutes(api huma.API, svc *search.Service) {
	tags := []string{"Search"}

	huma.Register(api, huma.Operation{
		OperationID: "search",
		Method:      http.MethodGet,
		Path:        "/search",
		Tags:        tags,
		Summary:     "Search",
		Description: "One query across several indexes, best matches first. The members index is " +
			"only searched for a signed-in caller. 503 if search isn't configured.",
	}, func(ctx context.Context, input *struct {
		Query    string         `query:"query"           required:"true" minLength:"1" doc:"What to search for."`
		Indexes  []search.Index `query:"indexes,explode" required:"true"               doc:"Which indexes to search."`
		Page     int            `query:"page"            doc:"1-based page number. Defaults to 1." minimum:"1" default:"1"`
		PageSize int            `query:"pageSize"        doc:"Hits per page." minimum:"1" maximum:"100" default:"20"`
	},
	) (*struct{ Body []search.Hit }, error) {
		indexes := make([]string, len(input.Indexes))
		for i, index := range input.Indexes {
			indexes[i] = string(index)
		}
		hits, err := svc.Search(ctx, search.Query{
			Query:   input.Query,
			Indexes: indexes,
			Limit:   input.PageSize,
			Offset:  (input.Page - 1) * input.PageSize,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []search.Hit }{Body: hits}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "start-search-sync",
		Method:        http.MethodPost,
		Path:          "/search/sync",
		Tags:          tags,
		Summary:       "Rebuild the search indexes",
		Description:   "Starts a rebuild of every index in the background; 409 if one is running. Needs core:admin. POST /search/sync/password (not in this document: its body is the raw SYNC_PASSWORD) does the same for a cron job.",
		DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, _ *struct{}) (*struct{}, error) {
		if err := svc.StartSync(ctx); err != nil {
			return nil, humaServiceError(err)
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
