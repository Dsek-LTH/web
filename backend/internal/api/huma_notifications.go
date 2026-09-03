package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/notifications"
)

type listNotificationsInput struct {
	Nolla bool `query:"nolla" doc:"true for the nollning-scoped subset (NEW_ARTICLE + /nollning-linked, since the current season started) instead of every notification"`
}

type listNotificationsOutput struct {
	Body []notifications.Group
}

// notificationIDFilterInput's ID is 0 when unset (huma doesn't support
// pointer query params) - notification ids are a SERIAL column starting at
// 1, so 0 is never a real id.
type notificationIDFilterInput struct {
	ID  int32   `query:"id"`
	IDs []int32 `query:"ids,explode"`
}

func (in *notificationIDFilterInput) idPtr() *int32 {
	if in.ID == 0 {
		return nil
	}
	return &in.ID
}

type uploadExpoTokenInput struct {
	Body struct {
		Token string `json:"token"`
	}
}

type getNotificationSettingsOutput struct {
	Body notifications.Settings
}

type putNotificationSettingsInput struct {
	Body notifications.Settings
}

func registerNotificationRoutes(api huma.API, svc *notifications.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-notifications",
		Method:      http.MethodGet,
		Path:        "/notifications",
		Summary:     "List the acting member's notifications, grouped",
	}, func(ctx context.Context, input *listNotificationsInput) (*listNotificationsOutput, error) {
		groups, err := svc.List(ctx, input.Nolla)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listNotificationsOutput{Body: groups}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "mark-notifications-read",
		Method:        http.MethodPatch,
		Path:          "/notifications/read",
		Summary:       "Mark one, several, or (with neither param) every unread notification as read",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *notificationIDFilterInput) (*struct{}, error) {
		if err := svc.MarkRead(ctx, input.idPtr(), input.IDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-notifications",
		Method:        http.MethodDelete,
		Path:          "/notifications",
		Summary:       "Delete one, several, or (with neither param) every notification",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *notificationIDFilterInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.idPtr(), input.IDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-expo-token",
		Method:        http.MethodPost,
		Path:          "/notifications/token",
		Summary:       "Register the acting member's Expo push token",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *uploadExpoTokenInput) (*struct{}, error) {
		if err := svc.UpsertExpoToken(ctx, input.Body.Token); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-notification-settings",
		Method:      http.MethodGet,
		Path:        "/notification-settings",
		Summary:     "Get the acting member's subscription settings",
	}, func(ctx context.Context, input *struct{}) (*getNotificationSettingsOutput, error) {
		settings, err := svc.GetSettings(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &getNotificationSettingsOutput{Body: *settings}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "put-notification-settings",
		Method:        http.MethodPut,
		Path:          "/notification-settings",
		Summary:       "Replace the acting member's subscription settings (full-replace)",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *putNotificationSettingsInput) (*struct{}, error) {
		if err := svc.PutSettings(ctx, input.Body); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
