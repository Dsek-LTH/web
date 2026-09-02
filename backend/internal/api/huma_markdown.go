package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/markdown"
)

type getMarkdownPageInput struct {
	Slug string `path:"slug"`
}

type markdownPageOutput struct {
	Body markdown.Page
}

type createMarkdownPageInput struct {
	Slug string `path:"slug"`
	Body markdown.PageInput
}

type updateMarkdownPageInput struct {
	Slug string `path:"slug"`
	Body markdown.PageInput
}

func registerMarkdownRoutes(api huma.API, svc *markdown.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-markdown-page",
		Method:      http.MethodGet,
		Path:        "/info/{slug}",
		Summary:     "Get a named markdown page",
	}, func(ctx context.Context, input *getMarkdownPageInput) (*markdownPageOutput, error) {
		page, err := svc.Get(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &markdownPageOutput{Body: *page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-markdown-page",
		Method:        http.MethodPost,
		Path:          "/info/{slug}",
		Summary:       "Create a named markdown page",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createMarkdownPageInput) (*markdownPageOutput, error) {
		page, err := svc.Create(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &markdownPageOutput{Body: *page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-markdown-page",
		Method:      http.MethodPatch,
		Path:        "/info/{slug}",
		Summary:     "Replace a named markdown page's content",
	}, func(ctx context.Context, input *updateMarkdownPageInput) (*markdownPageOutput, error) {
		page, err := svc.Update(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &markdownPageOutput{Body: *page}, nil
	})
}
