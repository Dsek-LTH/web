package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/doors"
)

type DoorNamePath struct {
	Name string `path:"name" doc:"The door's internal name."`
}

func registerDoorRoutes(api huma.API, svc *doors.Service) {
	tags := []string{"Doors"}

	huma.Register(api, huma.Operation{
		OperationID: "list-doors",
		Method:      http.MethodGet,
		Path:        "/doors",
		Tags:        tags,
		Summary:     "List doors",
		Description: "Needs core:access:door:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []doors.Door }, error) {
		items, err := svc.ListDoors(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []doors.Door }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-door-access-policies",
		Method:      http.MethodGet,
		Path:        "/doors/{name}/access-policies",
		Tags:        tags,
		Summary:     "List a door's access policies",
		Description: "Every rule that hasn't ended, including ones that haven't started. Needs core:access:door:read.",
	}, func(ctx context.Context, input *DoorNamePath) (*struct{ Body []doors.DoorAccessPolicy }, error) {
		items, err := svc.ListAccessPolicies(ctx, input.Name)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []doors.DoorAccessPolicy }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-door-access-policy",
		Method:        http.MethodPost,
		Path:          "/doors/{name}/access-policies",
		Tags:          tags,
		Summary:       "Create a door access policy",
		Description:   "Grant or ban access. The member or role must exist. Needs core:access:door:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		DoorNamePath
		Body doors.DoorAccessPolicyInput
	},
	) (*struct{ Body doors.DoorAccessPolicy }, error) {
		policy, err := svc.CreateAccessPolicy(ctx, input.Name, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body doors.DoorAccessPolicy }{Body: *policy}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-door-access-policy",
		Method:        http.MethodDelete,
		Path:          "/doors/{name}/access-policies/{id}",
		Tags:          tags,
		Summary:       "Delete a door access policy",
		Description:   "Needs core:access:door:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		DoorNamePath
		IDPath
	},
	) (*struct{}, error) {
		if err := svc.DeleteAccessPolicy(ctx, input.Name, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-member-door-access",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/door-access",
		Tags:        tags,
		Summary:     "List a member's door access",
		Description: "Which doors the member can open now. Only for the member themselves; empty for anyone else.",
	}, func(ctx context.Context, input *StudentIDPath) (*struct{ Body []doors.MemberDoorAccess }, error) {
		items, err := svc.MemberAccess(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []doors.MemberDoorAccess }{Body: items}, nil
	})
}

// SaltoHandler is a plain (non-huma) endpoint - the response is a bare newline-separated student-ID
// list, not JSON, and the URL itself ("/salto/{door}") must never change
// (see src/routes/(app)/salto/README.md: the university's Salto door-lock
// system polls this exact path). Mounted directly on the mux in router.go.
// Deliberately calls no auth check at all - Salto has no session of its
// own, matching the old +server.ts exactly (a public, unauthenticated
// read); the real access decision is entirely inside
// doors.Service.ResolveAllowedStudentIDs.
func SaltoHandler(svc *doors.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		door := r.PathValue("door")
		allowed := svc.ResolveAllowedStudentIDs(r.Context(), door)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprint(w, strings.Join(allowed, "\n"))
	}
}
