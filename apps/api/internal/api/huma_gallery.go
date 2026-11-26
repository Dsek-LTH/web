package api

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/gallery"
)

func registerGalleryRoutes(api huma.API, svc *gallery.Service) {
	tags := []string{"Gallery"}

	huma.Register(api, huma.Operation{
		OperationID: "list-albums",
		Method:      http.MethodGet,
		Path:        "/albums",
		Tags:        tags,
		Summary:     "List albums",
		Description: "Every album, newest first, with its picture count and cover. During a nollning " +
			"season, albums from before it started are hidden unless the caller has member:see_staben. " +
			"Needs fileHandler:albums:read.",
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
		Description: "The album with its pictures and cover. Hidden like in the list. " +
			"Needs fileHandler:albums:read.",
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug" doc:"The album's slug."`
	},
	) (*struct{ Body gallery.AlbumDetail }, error) {
		album, err := svc.GetAlbum(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body gallery.AlbumDetail }{Body: *album}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-album",
		Method:      http.MethodPost,
		Path:        "/albums",
		Tags:        tags,
		Summary:     "Create an album",
		Description: "Creates an album with its pictures. Every picture must be a JPEG, PNG, WebP or GIF " +
			"of at most 25 MB; each is turned upright, scaled down to at most 1920 pixels wide and stored " +
			"as a JPEG (a PNG if it has transparency). Without a cover, the first picture is the cover. " +
			"Needs gallery:create and fileHandler:albums:create.",
		DefaultStatus: http.StatusCreated,
		MaxBodyBytes:  maxAlbumUpload,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			Title         string          `form:"title"         required:"true" doc:"Not empty."`
			Date          string          `form:"date"          required:"true" doc:"YYYY-MM-DD."`
			Description   string          `form:"description" required:"false" doc:"Plain text."`
			Photographers []string        `form:"photographers" required:"false" doc:"Student ids of the photographers."`
			Editors       []string        `form:"editors" required:"false" doc:"Student ids of the editors."`
			Cover         huma.FormFile   `form:"cover"         required:"false" doc:"The cover picture."`
			Files         []huma.FormFile `form:"files"         required:"true" doc:"The pictures."`
		}]
	},
	) (*struct{ Body gallery.AlbumDetail }, error) {
		data := input.RawBody.Data()
		files := make([]gallery.UploadFile, len(data.Files))
		for i, f := range data.Files {
			files[i] = gallery.UploadFile{Filename: f.Filename, Data: f}
		}
		var cover *gallery.UploadFile
		if data.Cover.IsSet {
			cover = &gallery.UploadFile{Filename: data.Cover.Filename, Data: data.Cover}
		}
		in := gallery.AlbumInput{
			Title:         data.Title,
			Date:          data.Date,
			Description:   &data.Description,
			Photographers: data.Photographers,
			Editors:       data.Editors,
		}
		album, err := svc.Create(ctx, in, files, cover)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body gallery.AlbumDetail }{Body: *album}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-album",
		Method:      http.MethodPut,
		Path:        "/albums/{slug}",
		Tags:        tags,
		Summary:     "Update an album",
		Description: "Replaces the album's details; its slug follows the new title and year. " +
			"Needs gallery:update.",
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug" doc:"The album's slug."`
		Body gallery.AlbumInput
	},
	) (*struct{ Body gallery.AlbumDetail }, error) {
		album, err := svc.Update(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body gallery.AlbumDetail }{Body: *album}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-album",
		Method:        http.MethodDelete,
		Path:          "/albums/{slug}",
		Tags:          tags,
		Summary:       "Delete an album",
		Description:   "Deletes the album and its pictures. Needs gallery:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug" doc:"The album's slug."`
	},
	) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "download-album",
		Method:      http.MethodGet,
		Path:        "/albums/{slug}/download",
		Tags:        tags,
		Summary:     "Download an album",
		Description: "The album's pictures (album/) and cover (cover/) as a zip, streamed. " +
			"Needs fileHandler:albums:read.",
		Responses: rawResponses("application/zip", "The album as a zip."),
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug" doc:"The album's slug."`
	},
	) (*huma.StreamResponse, error) {
		download, err := svc.Download(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &huma.StreamResponse{Body: func(hctx huma.Context) {
			hctx.SetHeader("Content-Type", "application/zip")
			hctx.SetHeader(
				"Content-Disposition",
				fmt.Sprintf("attachment; filename=%q", download.Slug+".zip"),
			)
			// Headers are sent by now, so a failure can only cut the zip
			// short.
			if err := download.Write(hctx.BodyWriter()); err != nil {
				slog.Error("gallery: write album zip", "slug", download.Slug, "err", err)
			}
		}}, nil
	})
}
