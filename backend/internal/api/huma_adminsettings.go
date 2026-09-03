package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/adminsettings"
)

type listAdminSettingsOutput struct {
	Body []adminsettings.Setting
}

type upsertAdminSettingInput struct {
	Key  string `path:"key"`
	Body struct {
		Value string `json:"value"`
	}
}

type adminSettingOutput struct {
	Body adminsettings.Setting
}

type deleteAdminSettingInput struct {
	Key string `path:"key"`
}

func registerAdminSettingsRoutes(api huma.API, svc *adminsettings.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-admin-settings",
		Method:      http.MethodGet,
		Path:        "/admin-settings",
		Summary:     "List every admin_settings key/value row",
	}, func(ctx context.Context, input *struct{}) (*listAdminSettingsOutput, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listAdminSettingsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "upsert-admin-setting",
		Method:      http.MethodPut,
		Path:        "/admin-settings/{key}",
		Summary:     "Create or update one admin_settings row",
	}, func(ctx context.Context, input *upsertAdminSettingInput) (*adminSettingOutput, error) {
		setting, err := svc.Upsert(ctx, input.Key, input.Body.Value)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &adminSettingOutput{Body: *setting}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-admin-setting",
		Method:        http.MethodDelete,
		Path:          "/admin-settings/{key}",
		Summary:       "Delete one admin_settings row",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteAdminSettingInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Key); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
