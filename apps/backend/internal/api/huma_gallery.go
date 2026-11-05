package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/gallery"
)

func registerGalleryRoutes(api huma.API, svc *gallery.Service) {
	tags := []string{"Gallery"}

	huma.Register(api, huma.Operation{
		OperationID: "list-albums",
		Method:      http.MethodGet,
		Path:        "/albums",
		Tags:        tags,
		Summary:     "List albums",
		Description: "Every album with its pictures. During a nollning season, albums from before it " +
			"started are hidden unless the caller has member:see_staben. Needs fileHandler:albums:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []gallery.Album }, error) {
		albums, err := svc.ListAlbums(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []gallery.Album }{Body: albums}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-album",
		Method:      http.MethodGet,
		Path:        "/albums/{slug}",
		Tags:        tags,
		Summary:     "Get an album",
		Description: "Its pictures and album.json metadata. Needs fileHandler:albums:read.",
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug" doc:"The album's key."`
	},
	) (*struct{ Body gallery.AlbumDetail }, error) {
		album, err := svc.GetAlbum(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body gallery.AlbumDetail }{Body: *album}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-album-pictures",
		Method:        http.MethodPost,
		Path:          "/albums",
		Tags:          tags,
		Summary:       "Upload pictures to an album",
		Description:   "Creates the album \"{date} {name}\" if it doesn't exist. Needs fileHandler:albums:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			Name  string          `form:"name"  required:"true" doc:"Album name."`
			Date  string          `form:"date"  required:"true" doc:"Album date, YYYY-MM-DD."`
			Files []huma.FormFile `form:"files" required:"true" doc:"The pictures."`
		}]
	},
	) (*struct{ Body gallery.UploadedAlbum }, error) {
		data := input.RawBody.Data()
		files := make([]gallery.UploadFile, len(data.Files))
		for i, f := range data.Files {
			files[i] = gallery.UploadFile{Filename: f.Filename, Data: f}
		}
		key, err := svc.UploadAlbum(ctx, data.Name, data.Date, files)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body gallery.UploadedAlbum }{Body: gallery.UploadedAlbum{Key: key}}, nil
	})
}
