package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/notifications"
)

type notificationIDsInput struct {
	IDs []int32 `query:"ids,explode" doc:"Notification ids (a group's individualIds). Omit for every notification."`
}

type notificationSettingsOutput struct {
	Body notifications.NotificationSettings
}

func registerNotificationRoutes(api huma.API, svc *notifications.Service) {
	tags := []string{"Notifications"}

	huma.Register(api, huma.Operation{
		OperationID: "list-notifications",
		Method:      http.MethodGet,
		Path:        "/notifications",
		Tags:        tags,
		Summary:     "List your notifications",
		Description: "The signed-in member's notifications, newest first, with repeats (likes, " +
			"comments on the same thing, ...) merged into groups. Without pageSize, all of them; " +
			"with it, one page of individual notifications, grouped within the page.",
	}, func(ctx context.Context, input *struct {
		Nollning bool `query:"nollning" doc:"Only the nollning ones: new articles and nollning links since the current season started. Empty outside a season."`
		Page     int  `query:"page"     doc:"1-based page number. Defaults to 1."`
		PageSize int  `query:"pageSize" doc:"Notifications per page. Omit for all." maximum:"500"`
	},
	) (*struct {
		Body notifications.NotificationList
	}, error,
	) {
		groups, hasMore, err := svc.List(ctx, input.Nollning, input.Page, input.PageSize)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body notifications.NotificationList
		}{
			Body: notifications.NotificationList{Notifications: groups, HasMore: hasMore},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "count-unread-notifications",
		Method:      http.MethodGet,
		Path:        "/notifications/unread-count",
		Tags:        tags,
		Summary:     "Count your unread notifications",
		Description: "The notification bell's badge.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body notifications.UnreadCount }, error) {
		n, err := svc.UnreadCount(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body notifications.UnreadCount }{
			Body: notifications.UnreadCount{Count: n},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "mark-notifications-read",
		Method:        http.MethodPost,
		Path:          "/notifications/mark-read",
		Tags:          tags,
		Summary:       "Mark notifications as read",
		Description:   "The given ones, or every unread one.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *notificationIDsInput) (*struct{}, error) {
		if err := svc.MarkRead(ctx, nil, input.IDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-notifications",
		Method:        http.MethodDelete,
		Path:          "/notifications",
		Tags:          tags,
		Summary:       "Delete notifications",
		Description:   "The given ones, or every one.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *notificationIDsInput) (*struct{}, error) {
		if err := svc.Delete(ctx, nil, input.IDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	// The native app uploads its token to SvelteKit's
	// /api/notifications/uploadToken, which proxies here.
	huma.Register(api, huma.Operation{
		OperationID:   "set-push-token",
		Method:        http.MethodPut,
		Path:          "/notifications/push-token",
		Tags:          tags,
		Summary:       "Register a push token",
		Description:   "Ties a device's Expo push token to the signed-in member (taking it over from anyone else).",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct{ Body notifications.PushTokenInput }) (*struct{}, error) {
		if err := svc.UpsertExpoToken(ctx, input.Body.Token); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-notification-settings",
		Method:      http.MethodGet,
		Path:        "/notification-settings",
		Tags:        tags,
		Summary:     "Get your notification settings",
		Description: "What the signed-in member gets notified about.",
	}, func(ctx context.Context, _ *struct{}) (*notificationSettingsOutput, error) {
		settings, err := svc.GetSettings(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &notificationSettingsOutput{Body: *settings}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-notification-settings",
		Method:      http.MethodPut,
		Path:        "/notification-settings",
		Tags:        tags,
		Summary:     "Replace your notification settings",
		Description: "Every setting at once.",
	}, func(ctx context.Context, input *struct {
		Body notifications.NotificationSettings
	},
	) (*notificationSettingsOutput, error) {
		if err := svc.PutSettings(ctx, input.Body); err != nil {
			return nil, humaServiceError(err)
		}
		settings, err := svc.GetSettings(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &notificationSettingsOutput{Body: *settings}, nil
	})
}
