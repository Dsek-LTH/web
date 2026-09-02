package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/governingdocs"
)

type listGoverningDocumentsOutput struct {
	Body []governingdocs.Document
}

type governingDocumentIDInput struct {
	ID string `path:"id"`
}

type governingDocumentOutput struct {
	Body governingdocs.Document
}

type createGoverningDocumentInput struct {
	Body governingdocs.DocumentInput
}

type updateGoverningDocumentInput struct {
	ID   string `path:"id"`
	Body governingdocs.DocumentInput
}

func registerGoverningDocumentRoutes(api huma.API, svc *governingdocs.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-governing-documents",
		Method:      http.MethodGet,
		Path:        "/governing-documents",
		Summary:     "List governing documents (styrdokument)",
	}, func(ctx context.Context, input *struct{}) (*listGoverningDocumentsOutput, error) {
		items, err := svc.List(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listGoverningDocumentsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-governing-document",
		Method:      http.MethodGet,
		Path:        "/governing-documents/{id}",
		Summary:     "Get a governing document by id (POLICY/GUIDELINE only)",
	}, func(ctx context.Context, input *governingDocumentIDInput) (*governingDocumentOutput, error) {
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
		Summary:       "Create a governing document",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createGoverningDocumentInput) (*governingDocumentOutput, error) {
		doc, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &governingDocumentOutput{Body: *doc}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-governing-document",
		Method:      http.MethodPatch,
		Path:        "/governing-documents/{id}",
		Summary:     "Replace a governing document (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateGoverningDocumentInput) (*governingDocumentOutput, error) {
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
		Summary:       "Soft-delete a governing document (any type)",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *governingDocumentIDInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
