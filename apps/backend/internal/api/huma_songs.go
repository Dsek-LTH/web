package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/songs"
)

type songSlugInput struct {
	Slug string `path:"slug"`
}

type songOutput struct {
	Body songs.Song
}

type songMetaInput struct {
	IncludeDeleted bool `query:"includeDeleted" doc:"Also count deleted songs. Needs song:delete; ignored otherwise."`
}

func registerSongRoutes(api huma.API, svc *songs.Service) {
	tags := []string{"Songs"}

	huma.Register(api, huma.Operation{
		OperationID: "list-songs",
		Method:      http.MethodGet,
		Path:        "/songs",
		Tags:        tags,
		Summary:     "List songs",
		Description: "The song archive, newest first. Needs song:read. pageSize defaults to 20.",
	}, func(ctx context.Context, input *struct {
		Search      string   `query:"search"           doc:"Free-text search over title, lyrics and melody."`
		TitleOnly   bool     `query:"titleOnly"        doc:"Search titles only."`
		Category    []string `query:"category,explode" doc:"Categories; a song matches if it has any of them."`
		OnlyDeleted bool     `query:"onlyDeleted"      doc:"List only soft-deleted songs (the trash). Needs song:delete; ignored otherwise."`
		Paging
	},
	) (*struct{ Body songs.SongList }, error) {
		params := songs.ListParams{
			TitleOnly:   input.TitleOnly,
			Categories:  input.Category,
			OnlyDeleted: input.OnlyDeleted,
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
		return &struct{ Body songs.SongList }{
			Body: songs.SongList{Songs: items, PageCount: pageCount},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-song-categories",
		Method:      http.MethodGet,
		Path:        "/songs/categories",
		Tags:        tags,
		Summary:     "List song categories",
		Description: "Every category in use, as stored - for the song form's autocomplete. Needs song:read.",
	}, func(ctx context.Context, input *songMetaInput) (*struct{ Body []string }, error) {
		items, err := svc.Categories(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []string }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-grouped-song-categories",
		Method:      http.MethodGet,
		Path:        "/songs/categories/grouped",
		Tags:        tags,
		Summary:     "List grouped song categories",
		Description: "Categories grouped for the filter chips: a map from category id to display name. Needs song:read.",
	}, func(ctx context.Context, input *songMetaInput) (*struct{ Body map[string]string }, error) {
		items, err := svc.GroupedCategories(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body map[string]string }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-song-melodies",
		Method:      http.MethodGet,
		Path:        "/songs/melodies",
		Tags:        tags,
		Summary:     "List song melodies",
		Description: "Every melody in use - for the song form's autocomplete. Needs song:read.",
	}, func(ctx context.Context, input *songMetaInput) (*struct{ Body []string }, error) {
		items, err := svc.Melodies(ctx, input.IncludeDeleted)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []string }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-song",
		Method:      http.MethodGet,
		Path:        "/songs/{slug}",
		Tags:        tags,
		Summary:     "Get a song",
		Description: "Needs song:read. A deleted song is returned too to someone with song:delete.",
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
		Tags:          tags,
		Summary:       "Create a song",
		Description:   "Needs song:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body songs.SongInput }) (*songOutput, error) {
		song, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &songOutput{Body: *song}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-song",
		Method:      http.MethodPut,
		Path:        "/songs/{slug}",
		Tags:        tags,
		Summary:     "Replace a song",
		Description: "Needs song:update.",
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug"`
		Body songs.SongInput
	},
	) (*songOutput, error) {
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
		Tags:          tags,
		Summary:       "Delete a song",
		Description:   "Soft delete; see restore. Needs song:delete.",
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
		Tags:          tags,
		Summary:       "Restore a deleted song",
		Description:   "Needs song:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *songSlugInput) (*struct{}, error) {
		if err := svc.Restore(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
