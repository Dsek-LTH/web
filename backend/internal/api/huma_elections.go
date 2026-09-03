package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/elections"
)

type listElectionsOutput struct {
	Body []elections.Election
}

type electionIDInput struct {
	ID string `path:"id"`
}

type electionOutput struct {
	Body elections.Election
}

type createElectionInput struct {
	Body elections.ElectionInput
}

type updateElectionInput struct {
	ID   string `path:"id"`
	Body elections.ElectionInput
}

func registerElectionRoutes(api huma.API, svc *elections.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-elections",
		Method:      http.MethodGet,
		Path:        "/elections",
		Summary:     "List open (not yet expired) committee elections, soonest-closing first",
	}, func(ctx context.Context, input *struct{}) (*listElectionsOutput, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listElectionsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-election",
		Method:      http.MethodGet,
		Path:        "/elections/{id}",
		Summary:     "Get an election by id, regardless of whether it has expired",
	}, func(ctx context.Context, input *electionIDInput) (*electionOutput, error) {
		e, err := svc.Get(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *e}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-election",
		Method:        http.MethodPost,
		Path:          "/elections",
		Summary:       "Create a committee election announcement",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createElectionInput) (*electionOutput, error) {
		e, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *e}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-election",
		Method:      http.MethodPatch,
		Path:        "/elections/{id}",
		Summary:     "Replace an election (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateElectionInput) (*electionOutput, error) {
		e, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &electionOutput{Body: *e}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-election",
		Method:        http.MethodDelete,
		Path:          "/elections/{id}",
		Summary:       "Delete an election (hard delete, no soft-delete column exists)",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *electionIDInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
