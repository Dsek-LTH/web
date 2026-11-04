package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/alerts"
)

func registerAlertRoutes(api huma.API, svc *alerts.Service) {
	tags := []string{"Alerts"}

	huma.Register(api, huma.Operation{
		OperationID: "list-alerts",
		Method:      http.MethodGet,
		Path:        "/alerts",
		Tags:        tags,
		Summary:     "List alerts",
		Description: "Every active alert banner, each saying whether the signed-in member dismissed it.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []alerts.Alert }, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []alerts.Alert }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-alert",
		Method:        http.MethodPost,
		Path:          "/alerts",
		Tags:          tags,
		Summary:       "Create an alert",
		Description:   "Needs alert.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body alerts.AlertInput }) (*struct{ Body alerts.Alert }, error) {
		alert, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body alerts.Alert }{Body: *alert}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-alert",
		Method:        http.MethodDelete,
		Path:          "/alerts/{id}",
		Tags:          tags,
		Summary:       "Delete an alert",
		Description:   "Soft delete. Needs alert.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "dismiss-alert",
		Method:        http.MethodPost,
		Path:          "/alerts/{id}/dismiss",
		Tags:          tags,
		Summary:       "Dismiss an alert",
		Description:   "Hides it for the signed-in member only.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Close(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
