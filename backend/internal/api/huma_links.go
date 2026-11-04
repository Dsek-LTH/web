package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/links"
)

type shortLinkOutput struct {
	Body links.ShortLink
}

func registerLinksRoutes(api huma.API, svc *links.Service) {
	tags := []string{"Admin"}

	huma.Register(api, huma.Operation{
		OperationID: "list-links",
		Method:      http.MethodGet,
		Path:        "/links",
		Tags:        tags,
		Summary:     "List short links",
		Description: "Short URLs in the link shortener (Shlink), 20 per page. Needs admin:shlink:read.",
	}, func(ctx context.Context, input *struct {
		Page    int      `query:"page"         doc:"1-based page number. Defaults to 1."`
		OrderBy string   `query:"orderBy"      doc:"Sort field." enum:"title,dateCreated,shortCode,longUrl,visits,nonBotVisits"`
		Dir     string   `query:"dir"          doc:"Sort direction." enum:"ASC,DESC"`
		Tags    []string `query:"tags,explode" doc:"Only links with these tags."`
		Search  string   `query:"search"       doc:"Free-text search."`
	},
	) (*struct{ Body links.ShortLinkList }, error) {
		list, err := svc.List(ctx, links.ListParams{
			Page:    input.Page,
			OrderBy: input.OrderBy,
			Dir:     input.Dir,
			Tags:    input.Tags,
			Search:  input.Search,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body links.ShortLinkList }{Body: *list}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-link-tags",
		Method:      http.MethodGet,
		Path:        "/links/tags",
		Tags:        tags,
		Summary:     "List short link tags",
		Description: "Needs admin:shlink:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []string }, error) {
		all, err := svc.ListTags(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []string }{Body: all}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-link-domains",
		Method:      http.MethodGet,
		Path:        "/links/domains",
		Tags:        tags,
		Summary:     "List short link domains",
		Description: "Needs admin:shlink:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []links.LinkDomain }, error) {
		all, err := svc.ListDomains(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []links.LinkDomain }{Body: all}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-link",
		Method:        http.MethodPost,
		Path:          "/links",
		Tags:          tags,
		Summary:       "Create a short link",
		Description:   "Needs admin:shlink:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body links.CreateLinkInput }) (*shortLinkOutput, error) {
		link, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &shortLinkOutput{Body: *link}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-link",
		Method:      http.MethodPut,
		Path:        "/links/{shortCode}",
		Tags:        tags,
		Summary:     "Replace a short link",
		Description: "Its target and tags; the short code can't change. Needs admin:shlink:update.",
	}, func(ctx context.Context, input *struct {
		ShortCode string `path:"shortCode"`
		Body      links.UpdateLinkInput
	},
	) (*shortLinkOutput, error) {
		link, err := svc.Update(ctx, input.ShortCode, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &shortLinkOutput{Body: *link}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-links",
		Method:        http.MethodDelete,
		Path:          "/links",
		Tags:          tags,
		Summary:       "Delete short links",
		Description:   "Then deletes any tag no link uses any more. Needs admin:shlink:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct{ Body links.DeleteLinksInput }) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Body.ShortCodes); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
