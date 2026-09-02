package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/songs"
)

type listSongsInput struct {
	Search      string   `query:"search"`
	Category    []string `query:"category,explode" doc:"ANY-match; repeat the param for multiple categories"`
	ShowDeleted bool     `query:"showDeleted"      doc:"trash view (only soft-deleted songs) instead of the active list; only honored for a caller holding song:delete"`
	Page        int      `query:"page"             doc:"1-based"`
	PageSize    int      `query:"pageSize"`
}

type listSongsOutput struct {
	Body struct {
		Songs     []songs.Song `json:"songs"`
		PageCount int          `json:"pageCount"`
	}
}

type songSlugInput struct {
	Slug string `path:"slug"`
}

type songOutput struct {
	Body songs.Song
}

type createSongInput struct {
	Body songs.SongInput
}

type updateSongInput struct {
	Slug string `path:"slug"`
	Body songs.SongInput
}

type listSongMetaInput struct {
	IncludeDeleted bool `query:"includeDeleted"`
}

type listSongCategoriesOutput struct {
	Body []string
}

type listGroupedSongCategoriesOutput struct {
	Body map[string]string
}

type listSongMelodiesOutput struct {
	Body []string
}

func registerSongRoutes(api huma.API, svc *songs.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-songs",
		Method:      http.MethodGet,
		Path:        "/songs",
		Summary:     "List songbook entries",
	}, func(ctx context.Context, input *listSongsInput) (*listSongsOutput, error) {
		params := songs.ListParams{
			ShowDeleted: input.ShowDeleted,
			Categories:  input.Category,
			Page:        input.Page,
			PageSize:    input.PageSize,
		}
		if input.Search != "" {
			params.Search = &input.Search
		}
		items, pageCount, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &listSongsOutput{}
		out.Body.Songs = items
		out.Body.PageCount = pageCount
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-song-categories",
		Method:      http.MethodGet,
		Path:        "/songs/categories",
		Summary:     "List existing song categories (raw, for autocomplete)",
	}, func(ctx context.Context, input *listSongMetaInput) (*listSongCategoriesOutput, error) {
		items, err := svc.Categories(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listSongCategoriesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-grouped-song-categories",
		Method:      http.MethodGet,
		Path:        "/songs/categories/grouped",
		Summary:     "List existing song categories, grouped for the filter chips",
	}, func(ctx context.Context, input *listSongMetaInput) (*listGroupedSongCategoriesOutput, error) {
		items, err := svc.GroupedCategories(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listGroupedSongCategoriesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-song-melodies",
		Method:      http.MethodGet,
		Path:        "/songs/melodies",
		Summary:     "List existing song melodies",
	}, func(ctx context.Context, input *listSongMetaInput) (*listSongMelodiesOutput, error) {
		items, err := svc.Melodies(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listSongMelodiesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-song",
		Method:      http.MethodGet,
		Path:        "/songs/{slug}",
		Summary:     "Get a song by slug",
	}, func(ctx context.Context, input *songSlugInput) (*songOutput, error) {
		song, err := svc.Get(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songOutput{Body: *song}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-song",
		Method:        http.MethodPost,
		Path:          "/songs",
		Summary:       "Create a song",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createSongInput) (*songOutput, error) {
		song, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songOutput{Body: *song}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-song",
		Method:      http.MethodPatch,
		Path:        "/songs/{slug}",
		Summary:     "Replace a song (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateSongInput) (*songOutput, error) {
		song, err := svc.Update(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songOutput{Body: *song}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-song",
		Method:        http.MethodDelete,
		Path:          "/songs/{slug}",
		Summary:       "Soft-delete a song",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *songSlugInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "restore-song",
		Method:        http.MethodPost,
		Path:          "/songs/{slug}/restore",
		Summary:       "Restore a soft-deleted song",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *songSlugInput) (*struct{}, error) {
		if err := svc.Restore(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
