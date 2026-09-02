// See huma_articles.go's package doc comment - same huma/code-first
// pattern, applied to the small admin CRUD over api_access_policies
// (backend/DESIGN.md's roadmap "Phase 1: directory foundation").
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
)

type listAccessPoliciesInput struct {
	APIName string `query:"apiName"`
}

type listAccessPoliciesOutput struct {
	Body []accesspolicies.AccessPolicy
}

type listAPINamesOutput struct {
	Body []string
}

type createAccessPolicyInput struct {
	Body accesspolicies.CreateInput
}

type accessPolicyOutput struct {
	Body accesspolicies.AccessPolicy
}

type deleteAccessPolicyInput struct {
	ID string `path:"id"`
}

func registerAccessPolicyRoutes(api huma.API, svc *accesspolicies.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-access-policies",
		Method:      http.MethodGet,
		Path:        "/access-policies",
		Summary:     "List access policy grants, optionally filtered by apiName",
	}, func(ctx context.Context, input *listAccessPoliciesInput) (*listAccessPoliciesOutput, error) {
		var apiName *string
		if input.APIName != "" {
			apiName = &input.APIName
		}
		items, err := svc.List(ctx, apiName)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listAccessPoliciesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-access-policy-api-names",
		Method:      http.MethodGet,
		Path:        "/access-policies/api-names",
		Summary:     "List the distinct apiName values already in use",
	}, func(ctx context.Context, _ *struct{}) (*listAPINamesOutput, error) {
		names, err := svc.ListDistinctAPINames(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listAPINamesOutput{Body: names}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-access-policy",
		Method:        http.MethodPost,
		Path:          "/access-policies",
		Summary:       "Grant an apiName to a role or a specific member (exactly one)",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createAccessPolicyInput) (*accessPolicyOutput, error) {
		policy, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &accessPolicyOutput{Body: *policy}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-access-policy",
		Method:        http.MethodDelete,
		Path:          "/access-policies/{id}",
		Summary:       "Revoke an access policy grant",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteAccessPolicyInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
