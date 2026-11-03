package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/pings"
)

type pingMemberInput struct {
	StudentID string `path:"studentId"`
}

func registerPingRoutes(api huma.API, svc *pings.Service) {
	huma.Register(api, huma.Operation{
		OperationID:   "ping-member",
		Method:        http.MethodPost,
		Path:          "/members/{studentId}/ping",
		Summary:       "Ping a member as the signed-in member",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *pingMemberInput) (*struct{}, error) {
		if err := svc.Ping(ctx, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
