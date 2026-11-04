package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/readme"
)

func registerReadmeRoutes(api huma.API, svc *readme.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-readme-issue",
		Method:      http.MethodGet,
		Path:        "/readmes/{year}/{number}",
		Tags:        []string{"Readme"},
		Summary:     "Get a Readme issue",
		Description: "One issue of the Readme newsletter, by year and number.",
	}, func(ctx context.Context, input *struct {
		Year   int32 `path:"year"`
		Number int32 `path:"number" doc:"Issue number within the year."`
	},
	) (*struct{ Body readme.ReadmeIssue }, error) {
		issue, err := svc.Get(ctx, input.Year, input.Number)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body readme.ReadmeIssue }{Body: *issue}, nil
	})
}
