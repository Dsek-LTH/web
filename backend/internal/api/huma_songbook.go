package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/songs"
)

type listSongBookInput struct {
	Search   string `query:"search"   doc:"a page number, or text to search song titles for"`
	Page     int    `query:"page"     doc:"1-based"`
	PageSize int    `query:"pageSize"`
}

type listSongBookOutput struct {
	Body struct {
		Entries   []songs.SongBookEntry `json:"entries"`
		PageCount int                   `json:"pageCount"`
	}
}

type songBookPositionInput struct {
	Page         int `path:"page"`
	NumberOnPage int `path:"numberOnPage"`
}

type songBookEntryOutput struct {
	Body songs.SongBookEntry
}

type createSongBookEntryInput struct {
	Body songs.SongBookEntryInput
}

type updateSongBookEntryInput struct {
	Page         int `path:"page"`
	NumberOnPage int `path:"numberOnPage"`
	Body         songs.SongBookEntryInput
}

// registerSongBookRoutes registers the printed songbook's entries (which
// song is on which page/number, upstream #1283) - a song itself is
// managed through /songs. A position or song that's already in the book
// answers 409, with "position" or "song" in the detail.
func registerSongBookRoutes(api huma.API, svc *songs.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-songbook",
		Method:      http.MethodGet,
		Path:        "/songbook",
		Summary:     "List songbook entries in page order",
	}, func(ctx context.Context, input *listSongBookInput) (*listSongBookOutput, error) {
		entries, pageCount, err := svc.ListSongBook(ctx, songs.SongBookListParams{
			Search:   input.Search,
			Page:     input.Page,
			PageSize: input.PageSize,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &listSongBookOutput{}
		out.Body.Entries = entries
		out.Body.PageCount = pageCount
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-songbook-entry",
		Method:      http.MethodGet,
		Path:        "/songbook/{page}/{numberOnPage}",
		Summary:     "Get the songbook entry at a page and number",
	}, func(ctx context.Context, input *songBookPositionInput) (*songBookEntryOutput, error) {
		entry, err := svc.GetSongBookEntry(ctx, input.Page, input.NumberOnPage)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-songbook-entry",
		Method:        http.MethodPost,
		Path:          "/songbook",
		Summary:       "Put a song in the songbook (song:create)",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createSongBookEntryInput) (*songBookEntryOutput, error) {
		entry, err := svc.CreateSongBookEntry(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-songbook-entry",
		Method:      http.MethodPatch,
		Path:        "/songbook/{page}/{numberOnPage}",
		Summary:     "Move a songbook entry and/or change its song (song:update)",
	}, func(ctx context.Context, input *updateSongBookEntryInput) (*songBookEntryOutput, error) {
		entry, err := svc.UpdateSongBookEntry(ctx, input.Page, input.NumberOnPage, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-songbook-entry",
		Method:        http.MethodDelete,
		Path:          "/songbook/{page}/{numberOnPage}",
		Summary:       "Take a song out of the songbook (song:delete)",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *songBookPositionInput) (*struct{}, error) {
		if err := svc.DeleteSongBookEntry(ctx, input.Page, input.NumberOnPage); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
