package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
)

func registerAccessPolicyRoutes(api huma.API, svc *accesspolicies.Service) {
	tags := []string{"Access policies"}

	huma.Register(api, huma.Operation{
		OperationID: "list-access-policies",
		Method:      http.MethodGet,
		Path:        "/access-policies",
		Tags:        tags,
		Summary:     "List access policies",
		Description: "Needs core:access:api:read.",
	}, func(ctx context.Context, input *struct {
		APIName string `query:"apiName" doc:"Only grants of this policy."`
	},
	) (*struct{ Body []accesspolicies.AccessPolicy }, error) {
		var apiName *string
		if input.APIName != "" {
			apiName = &input.APIName
		}
		items, err := svc.List(ctx, apiName)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []accesspolicies.AccessPolicy }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-access-policy-api-names",
		Method:      http.MethodGet,
		Path:        "/access-policies/api-names",
		Tags:        tags,
		Summary:     "List granted policies",
		Description: "Every policy that has at least one grant, with how many. Needs core:access:api:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct {
		Body []accesspolicies.AccessPolicyAPIName
	}, error,
	) {
		names, err := svc.ListAPINames(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []accesspolicies.AccessPolicyAPIName
		}{Body: names}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-access-policies-bulk",
		Method:        http.MethodPost,
		Path:          "/access-policies/bulk",
		Tags:          tags,
		Summary:       "Grant a policy to several roles and members",
		Description:   "All or nothing. Needs core:access:api:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		Body accesspolicies.AccessPolicyBulkInput
	},
	) (*struct{ Body []accesspolicies.AccessPolicy }, error) {
		policies, err := svc.CreateBulk(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []accesspolicies.AccessPolicy }{Body: policies}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-access-policy",
		Method:        http.MethodPost,
		Path:          "/access-policies",
		Tags:          tags,
		Summary:       "Grant a policy",
		Description:   "To a role or to one member. Needs core:access:api:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		Body accesspolicies.AccessPolicyInput
	},
	) (*struct{ Body accesspolicies.AccessPolicy }, error) {
		policy, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body accesspolicies.AccessPolicy }{Body: *policy}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-access-policy",
		Method:        http.MethodDelete,
		Path:          "/access-policies/{id}",
		Tags:          tags,
		Summary:       "Revoke a policy grant",
		Description:   "Needs core:access:api:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
