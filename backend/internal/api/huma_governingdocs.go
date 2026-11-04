package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/governingdocs"
)

type governingDocumentOutput struct {
	Body governingdocs.GoverningDocument
}

func registerGoverningDocumentRoutes(api huma.API, svc *governingdocs.Service) {
	tags := []string{"Governing documents"}

	huma.Register(api, huma.Operation{
		OperationID: "list-governing-documents",
		Method:      http.MethodGet,
		Path:        "/governing-documents",
		Tags:        tags,
		Summary:     "List governing documents",
		Description: "Every non-deleted governing document (styrdokument), of any type. Needs governing_document:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct {
		Body []governingdocs.GoverningDocument
	}, error,
	) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []governingdocs.GoverningDocument
		}{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-governing-document",
		Method:      http.MethodGet,
		Path:        "/governing-documents/{id}",
		Tags:        tags,
		Summary:     "Get a governing document",
		Description: "Only POLICY and GUIDELINE documents, the editable kinds. Needs governing_document:read.",
	}, func(ctx context.Context, input *IDPath) (*governingDocumentOutput, error) {
		doc, err := svc.Get(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &governingDocumentOutput{Body: *doc}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-governing-document",
		Method:        http.MethodPost,
		Path:          "/governing-documents",
		Tags:          tags,
		Summary:       "Create a governing document",
		Description:   "Needs governing_document:write.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		Body governingdocs.GoverningDocumentInput
	},
	) (*governingDocumentOutput, error) {
		doc, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &governingDocumentOutput{Body: *doc}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-governing-document",
		Method:      http.MethodPut,
		Path:        "/governing-documents/{id}",
		Tags:        tags,
		Summary:     "Replace a governing document",
		Description: "Needs governing_document:write.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body governingdocs.GoverningDocumentInput
	},
	) (*governingDocumentOutput, error) {
		doc, err := svc.Update(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &governingDocumentOutput{Body: *doc}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-governing-document",
		Method:        http.MethodDelete,
		Path:          "/governing-documents/{id}",
		Tags:          tags,
		Summary:       "Delete a governing document",
		Description:   "Soft delete, of any type. Needs governing_document:write.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
