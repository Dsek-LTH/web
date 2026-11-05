package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/pings"
)

func registerPingRoutes(api huma.API, svc *pings.Service) {
	huma.Register(api, huma.Operation{
		OperationID:   "ping-member",
		Method:        http.MethodPost,
		Path:          "/members/{studentId}/ping",
		Tags:          []string{"Members"},
		Summary:       "Ping a member",
		Description:   "As the signed-in member. Needs core:member:ping. The pinged member is notified.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *StudentIDPath) (*struct{}, error) {
		if err := svc.Ping(ctx, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
