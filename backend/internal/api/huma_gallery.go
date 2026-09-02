package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/gallery"
)

type listAlbumsOutput struct {
	Body []gallery.Album
}

type albumSlugInput struct {
	Slug string `path:"slug"`
}

type albumOutput struct {
	Body gallery.AlbumDetail
}

type uploadAlbumInput struct {
	RawBody huma.MultipartFormFiles[struct {
		Name  string          `form:"name" required:"true"`
		Date  string          `form:"date" required:"true"`
		Files []huma.FormFile `form:"files" required:"true"`
	}]
}

func registerGalleryRoutes(api huma.API, svc *gallery.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-albums",
		Method:      http.MethodGet,
		Path:        "/gallery",
		Summary:     "List gallery albums",
	}, func(ctx context.Context, input *struct{}) (*listAlbumsOutput, error) {
		albums, err := svc.ListAlbums(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listAlbumsOutput{Body: albums}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-album",
		Method:      http.MethodGet,
		Path:        "/gallery/{slug}",
		Summary:     "Get one gallery album's pictures and metadata",
	}, func(ctx context.Context, input *albumSlugInput) (*albumOutput, error) {
		album, err := svc.GetAlbum(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &albumOutput{Body: *album}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-album",
		Method:        http.MethodPost,
		Path:          "/gallery/upload",
		Summary:       "Upload one or more pictures to a gallery album",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *uploadAlbumInput) (*struct{}, error) {
		data := input.RawBody.Data()
		files := make([]gallery.UploadFile, len(data.Files))
		for i, f := range data.Files {
			files[i] = gallery.UploadFile{Filename: f.Filename, Data: f}
		}
		if err := svc.UploadAlbum(ctx, data.Name, data.Date, files); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
