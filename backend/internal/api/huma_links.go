package api

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/links"
)

type listLinksInput struct {
	Page    int      `query:"page"`
	OrderBy string   `query:"orderBy"      doc:"one of title, dateCreated, shortCode, longUrl, visits, nonBotVisits"`
	Dir     string   `query:"dir"          doc:"ASC or DESC"`
	Tags    []string `query:"tags,explode"`
	Search  string   `query:"search"`
}

type rawJSONOutput struct {
	Body json.RawMessage
}

type createLinkInput struct {
	Body links.CreateLinkInput
}

type updateLinkInput struct {
	ShortCode string `path:"shortCode"`
	Body      links.UpdateLinkInput
}

type deleteLinksInput struct {
	Body struct {
		ShortCodes []string `json:"shortCodes"`
	}
}

func registerLinksRoutes(api huma.API, svc *links.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-links",
		Method:      http.MethodGet,
		Path:        "/links",
		Summary:     "List Shlink short URLs (proxied verbatim)",
	}, func(ctx context.Context, input *listLinksInput) (*rawJSONOutput, error) {
		body, err := svc.List(ctx, links.ListParams{
			Page:    input.Page,
			OrderBy: input.OrderBy,
			Dir:     input.Dir,
			Tags:    input.Tags,
			Search:  input.Search,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &rawJSONOutput{Body: body}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-link-tags",
		Method:      http.MethodGet,
		Path:        "/links/tags",
		Summary:     "List Shlink tags with stats (proxied verbatim)",
	}, func(ctx context.Context, input *struct{}) (*rawJSONOutput, error) {
		body, err := svc.ListTags(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &rawJSONOutput{Body: body}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-link",
		Method:        http.MethodPost,
		Path:          "/links",
		Summary:       "Create a Shlink short URL",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createLinkInput) (*rawJSONOutput, error) {
		body, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &rawJSONOutput{Body: body}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-link",
		Method:      http.MethodPatch,
		Path:        "/links/{shortCode}",
		Summary:     "Update a Shlink short URL's target/tags",
	}, func(ctx context.Context, input *updateLinkInput) (*rawJSONOutput, error) {
		body, err := svc.Update(ctx, input.ShortCode, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &rawJSONOutput{Body: body}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-links",
		Method:        http.MethodDelete,
		Path:          "/links",
		Summary:       "Delete one or more Shlink short URLs, then prune emptied tags",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteLinksInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Body.ShortCodes); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
