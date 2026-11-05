package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/elections"
)

type electionOutput struct {
	Body elections.Election
}

func registerElectionRoutes(api huma.API, svc *elections.Service) {
	tags := []string{"Elections"}

	huma.Register(api, huma.Operation{
		OperationID: "list-elections",
		Method:      http.MethodGet,
		Path:        "/elections",
		Tags:        tags,
		Summary:     "List open elections",
		Description: "Elections that haven't closed, soonest closing first.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []elections.Election }, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []elections.Election }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-election",
		Method:      http.MethodGet,
		Path:        "/elections/{id}",
		Tags:        tags,
		Summary:     "Get an election",
		Description: "Closed ones too.",
	}, func(ctx context.Context, input *IDPath) (*electionOutput, error) {
		election, err := svc.Get(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *election}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-election",
		Method:        http.MethodPost,
		Path:          "/elections",
		Tags:          tags,
		Summary:       "Create an election",
		Description:   "Needs election:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body elections.ElectionInput }) (*electionOutput, error) {
		election, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *election}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-election",
		Method:      http.MethodPut,
		Path:        "/elections/{id}",
		Tags:        tags,
		Summary:     "Replace an election",
		Description: "Needs election:update.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body elections.ElectionInput
	},
	) (*electionOutput, error) {
		election, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *election}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-election",
		Method:        http.MethodDelete,
		Path:          "/elections/{id}",
		Tags:          tags,
		Summary:       "Delete an election",
		Description:   "Needs election:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
