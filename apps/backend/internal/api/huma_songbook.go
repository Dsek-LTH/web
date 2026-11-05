package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/songs"
)

type SongBookPosition struct {
	Page         int `path:"page"         doc:"Page in the printed songbook."`
	NumberOnPage int `path:"numberOnPage" doc:"The song's number on that page."`
}

type songBookEntryOutput struct {
	Body songs.SongBookEntry
}

// registerSongBookRoutes registers the printed songbook's entries (which
// song is on which page/number, upstream #1283) - a song itself is
// managed through /songs. A position or song that's already in the book
// answers 409, with "position" or "song" in the detail.
func registerSongBookRoutes(api huma.API, svc *songs.Service) {
	tags := []string{"Songs"}

	huma.Register(api, huma.Operation{
		OperationID: "list-songbook-entries",
		Method:      http.MethodGet,
		Path:        "/songbook-entries",
		Tags:        tags,
		Summary:     "List songbook entries",
		Description: "The printed songbook's index, in page order. Needs song:read. pageSize defaults to 20.",
	}, func(ctx context.Context, input *struct {
		Search string `query:"search" doc:"A page number, or text to search song titles for."`
		Paging
	},
	) (*struct{ Body songs.SongBookEntryList }, error) {
		entries, pageCount, err := svc.ListSongBook(ctx, songs.SongBookListParams{
			Search:   input.Search,
			Page:     input.Page,
			PageSize: input.PageSize,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body songs.SongBookEntryList }{
			Body: songs.SongBookEntryList{Entries: entries, PageCount: pageCount},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-songbook-entry",
		Method:      http.MethodGet,
		Path:        "/songbook-entries/{page}/{numberOnPage}",
		Tags:        tags,
		Summary:     "Get a songbook entry",
		Description: "The song at a page and number. Needs song:read.",
	}, func(ctx context.Context, input *SongBookPosition) (*songBookEntryOutput, error) {
		entry, err := svc.GetSongBookEntry(ctx, input.Page, input.NumberOnPage)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-songbook-entry",
		Method:        http.MethodPost,
		Path:          "/songbook-entries",
		Tags:          tags,
		Summary:       "Put a song in the songbook",
		Description:   "Needs song:create. 409 if the position is taken or the song is already in the book.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body songs.SongBookEntryInput }) (*songBookEntryOutput, error) {
		entry, err := svc.CreateSongBookEntry(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-songbook-entry",
		Method:      http.MethodPut,
		Path:        "/songbook-entries/{page}/{numberOnPage}",
		Tags:        tags,
		Summary:     "Replace a songbook entry",
		Description: "Move it and/or change its song. Needs song:update. 409 as for create.",
	}, func(ctx context.Context, input *struct {
		SongBookPosition
		Body songs.SongBookEntryInput
	},
	) (*songBookEntryOutput, error) {
		entry, err := svc.UpdateSongBookEntry(ctx, input.Page, input.NumberOnPage, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songBookEntryOutput{Body: *entry}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-songbook-entry",
		Method:        http.MethodDelete,
		Path:          "/songbook-entries/{page}/{numberOnPage}",
		Tags:          tags,
		Summary:       "Take a song out of the songbook",
		Description:   "The song itself stays in the archive. Needs song:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *SongBookPosition) (*struct{}, error) {
		if err := svc.DeleteSongBookEntry(ctx, input.Page, input.NumberOnPage); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
