package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/adminsettings"
)

type AdminSettingKeyPath struct {
	Key string `path:"key"`
}

func registerAdminSettingsRoutes(api huma.API, svc *adminsettings.Service) {
	tags := []string{"Admin"}

	huma.Register(api, huma.Operation{
		OperationID: "list-admin-settings",
		Method:      http.MethodGet,
		Path:        "/admin-settings",
		Tags:        tags,
		Summary:     "List admin settings",
		Description: "Operator key/value settings, e.g. the Discord webhook. Needs admin:settings:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []adminsettings.AdminSetting }, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []adminsettings.AdminSetting }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-admin-setting",
		Method:      http.MethodPut,
		Path:        "/admin-settings/{key}",
		Tags:        tags,
		Summary:     "Set an admin setting",
		Description: "Creates or replaces it. Needs admin:settings:update.",
	}, func(ctx context.Context, input *struct {
		AdminSettingKeyPath
		Body adminsettings.AdminSettingInput
	},
	) (*struct{ Body adminsettings.AdminSetting }, error) {
		setting, err := svc.Upsert(ctx, input.Key, input.Body.Value)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body adminsettings.AdminSetting }{Body: *setting}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-admin-setting",
		Method:        http.MethodDelete,
		Path:          "/admin-settings/{key}",
		Tags:          tags,
		Summary:       "Delete an admin setting",
		Description:   "Needs admin:settings:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *AdminSettingKeyPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Key); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
