package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/readme"
)

type getReadmeIssueInput struct {
	Year   int32 `path:"year"`
	Number int32 `path:"number"`
}

type readmeIssueOutput struct {
	Body readme.ReadmeIssue
}

func registerReadmeRoutes(api huma.API, svc *readme.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-readme-issue",
		Method:      http.MethodGet,
		Path:        "/readmes/{year}/{number}",
		Summary:     "Get one issue of the README newsletter",
	}, func(ctx context.Context, input *getReadmeIssueInput) (*readmeIssueOutput, error) {
		issue, err := svc.Get(ctx, input.Year, input.Number)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &readmeIssueOutput{Body: *issue}, nil
	})
}
