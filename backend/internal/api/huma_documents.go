package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/documents"
)

type listMeetingsInput struct {
	Type string `query:"type" required:"true" doc:"one of board-meeting, guild-meeting, SRD-meeting, other"`
	Year int    `query:"year" required:"true"`
}

type listMeetingsOutput struct {
	Body []documents.Meeting
}

type listRequirementsInput struct {
	Year int `query:"year" required:"true"`
}

type listRequirementsOutput struct {
	Body []documents.RequirementFolder
}

type uploadDocumentInput struct {
	RawBody huma.MultipartFormFiles[struct {
		Type   string        `form:"type"   required:"true" doc:"one of meeting, srd, requirement"`
		Year   int           `form:"year"   required:"true"`
		Folder string        `form:"folder"`
		Name   string        `form:"name"`
		File   huma.FormFile `form:"file"   required:"true"`
	}]
}

type deleteDocumentInput struct {
	Type string `query:"type" required:"true" doc:"one of board-meeting, guild-meeting, SRD-meeting, other"`
	ID   string `query:"id"   required:"true"`
}

type deleteRequirementInput struct {
	ID string `query:"id" required:"true"`
}

func registerDocumentRoutes(api huma.API, svc *documents.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-meetings",
		Method:      http.MethodGet,
		Path:        "/documents",
		Summary:     "List meeting documents (board/guild/SRD/other) for a year",
	}, func(ctx context.Context, input *listMeetingsInput) (*listMeetingsOutput, error) {
		meetings, err := svc.ListMeetings(ctx, input.Type, input.Year)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listMeetingsOutput{Body: meetings}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-requirement-profiles",
		Method:      http.MethodGet,
		Path:        "/documents/requirements",
		Summary:     "List position/committee requirement-profile documents for a year",
	}, func(ctx context.Context, input *listRequirementsInput) (*listRequirementsOutput, error) {
		folders, err := svc.ListRequirements(ctx, input.Year)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listRequirementsOutput{Body: folders}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-document",
		Method:        http.MethodPost,
		Path:          "/documents/upload",
		Summary:       "Upload a meeting/SRD/requirement-profile document",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *uploadDocumentInput) (*struct{}, error) {
		data := input.RawBody.Data()
		file := documents.UploadFile{Filename: data.File.Filename, Data: data.File}
		err := svc.Upload(ctx, data.Type, data.Year, data.Folder, data.Name, file)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-document",
		Method:        http.MethodDelete,
		Path:          "/documents",
		Summary:       "Delete a meeting document",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteDocumentInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Type, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-requirement-profile",
		Method:        http.MethodDelete,
		Path:          "/documents/requirements",
		Summary:       "Delete a requirement-profile document",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteRequirementInput) (*struct{}, error) {
		if err := svc.DeleteRequirement(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
