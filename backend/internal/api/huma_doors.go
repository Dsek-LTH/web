package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/doors"
)

type listDoorsOutput struct {
	Body []doors.Door
}

type doorNameInput struct {
	Name string `path:"name"`
}

type listDoorAccessPoliciesOutput struct {
	Body []doors.DoorAccessPolicy
}

type createDoorAccessPolicyInput struct {
	Name string `path:"name"`
	Body doors.CreatePolicyInput
}

type doorAccessPolicyOutput struct {
	Body doors.DoorAccessPolicy
}

type doorAccessPolicyIDInput struct {
	ID string `path:"id"`
}

type memberDoorAccessInput struct {
	StudentID string `path:"studentId"`
}

type memberDoorAccessOutput struct {
	Body []doors.MemberAccess
}

func registerDoorRoutes(api huma.API, svc *doors.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-doors",
		Method:      http.MethodGet,
		Path:        "/doors",
		Summary:     "List every physical door",
	}, func(ctx context.Context, input *struct{}) (*listDoorsOutput, error) {
		items, err := svc.ListDoors(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listDoorsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-door-access-policies",
		Method:      http.MethodGet,
		Path:        "/doors/{name}/access-policies",
		Summary:     "List a door's non-expired access policies",
	}, func(ctx context.Context, input *doorNameInput) (*listDoorAccessPoliciesOutput, error) {
		items, err := svc.ListAccessPolicies(ctx, input.Name)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listDoorAccessPoliciesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-door-access-policy",
		Method:        http.MethodPost,
		Path:          "/doors/{name}/access-policies",
		Summary:       "Grant or restrict access to a door",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createDoorAccessPolicyInput) (*doorAccessPolicyOutput, error) {
		policy, err := svc.CreateAccessPolicy(ctx, input.Name, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &doorAccessPolicyOutput{Body: *policy}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-door-access-policy",
		Method:        http.MethodDelete,
		Path:          "/door-access-policies/{id}",
		Summary:       "Remove a door access policy",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *doorAccessPolicyIDInput) (*struct{}, error) {
		if err := svc.DeleteAccessPolicy(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-member-door-access",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/door-access",
		Summary:     "The acting member's own current door access (self-view only, empty for anyone else)",
	}, func(ctx context.Context, input *memberDoorAccessInput) (*memberDoorAccessOutput, error) {
		items, err := svc.MemberAccess(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberDoorAccessOutput{Body: items}, nil
	})
}

// SaltoHandler is a plain (non-huma) endpoint, like /me and
// MedalsCSVHandler - the response is a bare newline-separated student-ID
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
