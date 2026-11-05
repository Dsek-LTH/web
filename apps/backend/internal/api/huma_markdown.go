package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/markdown"
)

type InfoPageSlug struct {
	Slug string `path:"slug" doc:"The page's name, e.g. cafe:open:0."`
}

type infoPageWriteInput struct {
	InfoPageSlug
	Body markdown.InfoPageInput
}

func registerMarkdownRoutes(api huma.API, svc *markdown.Service) {
	tags := []string{"Info pages"}

	huma.Register(api, huma.Operation{
		OperationID: "get-info-page",
		Method:      http.MethodGet,
		Path:        "/info-pages/{slug}",
		Tags:        tags,
		Summary:     "Get an info page",
		Description: "Public. 404 if no page has this name.",
	}, func(ctx context.Context, input *InfoPageSlug) (*struct{ Body markdown.InfoPage }, error) {
		page, err := svc.Get(ctx, input.Slug)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body markdown.InfoPage }{Body: *page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-info-page",
		Method:        http.MethodPost,
		Path:          "/info-pages/{slug}",
		Tags:          tags,
		Summary:       "Create an info page",
		Description:   "Needs markdown:create. The creator is granted markdowns:<slug>:update for it.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *infoPageWriteInput) (*struct{ Body markdown.InfoPage }, error) {
		page, err := svc.Create(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body markdown.InfoPage }{Body: *page}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-info-page",
		Method:      http.MethodPut,
		Path:        "/info-pages/{slug}",
		Tags:        tags,
		Summary:     "Replace an info page",
		Description: "Needs markdown:update, or markdowns:<slug>:update for this page.",
	}, func(ctx context.Context, input *infoPageWriteInput) (*struct{ Body markdown.InfoPage }, error) {
		page, err := svc.Update(ctx, input.Slug, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body markdown.InfoPage }{Body: *page}, nil
	})
}
