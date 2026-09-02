package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/alerts"
)

type listAlertsOutput struct {
	Body []alerts.Alert
}

type createAlertInput struct {
	Body alerts.AlertInput
}

type alertOutput struct {
	Body alerts.Alert
}

type alertIDInput struct {
	ID string `path:"id"`
}

func registerAlertRoutes(api huma.API, svc *alerts.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-alerts",
		Method:      http.MethodGet,
		Path:        "/alerts",
		Summary:     "List active site-wide alerts",
	}, func(ctx context.Context, input *struct{}) (*listAlertsOutput, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listAlertsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-alert",
		Method:        http.MethodPost,
		Path:          "/alerts",
		Summary:       "Create a site-wide alert",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createAlertInput) (*alertOutput, error) {
		alert, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &alertOutput{Body: *alert}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-alert",
		Method:        http.MethodDelete,
		Path:          "/alerts/{id}",
		Summary:       "Soft-delete an alert",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *alertIDInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "close-alert",
		Method:        http.MethodPost,
		Path:          "/alerts/{id}/close",
		Summary:       "Dismiss an alert as the acting member",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *alertIDInput) (*struct{}, error) {
		if err := svc.Close(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
