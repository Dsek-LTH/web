package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"

	"github.com/dsek-lth/web/backend/internal/documents"
)

type storedFileOutput struct {
	Body documents.StoredFile
}

func registerDocumentRoutes(api huma.API, svc *documents.Service) {
	tags := []string{"Documents"}

	huma.Register(api, huma.Operation{
		OperationID: "list-meetings",
		Method:      http.MethodGet,
		Path:        "/meeting-documents",
		Tags:        tags,
		Summary:     "List meeting documents",
		Description: "One year's meetings of one kind, each with its notice, agenda and minutes picked out. " +
			"Needs fileHandler:documents:read (fileHandler:files:read for SRD).",
	}, func(ctx context.Context, input *struct {
		Type documents.MeetingType `query:"type" required:"true"`
		Year int                   `query:"year" required:"true"`
	},
	) (*struct{ Body []documents.Meeting }, error) {
		meetings, err := svc.ListMeetings(ctx, string(input.Type), input.Year)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []documents.Meeting }{Body: meetings}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-meeting-document",
		Method:        http.MethodPost,
		Path:          "/meeting-documents",
		Tags:          tags,
		Summary:       "Upload a meeting document",
		Description:   "Into public/{year}/{folder} (SRD: public/srd/{year}/{folder}). Needs fileHandler:documents:create (fileHandler:files:create for SRD).",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			Type   documents.MeetingUploadType `form:"type"   required:"true"`
			Year   int                         `form:"year"   required:"true"`
			Folder string                      `form:"folder" doc:"The meeting folder, e.g. S01."`
			Name   string                      `form:"name"   doc:"File name without extension; the uploaded file's extension is kept."`
			File   huma.FormFile               `form:"file"   required:"true"`
		}]
	},
	) (*storedFileOutput, error) {
		data := input.RawBody.Data()
		file := documents.UploadFile{Filename: data.File.Filename, Data: data.File}
		stored, err := svc.Upload(ctx, string(data.Type), data.Year, data.Folder, data.Name, file)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &storedFileOutput{Body: *stored}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-meeting-document",
		Method:        http.MethodDelete,
		Path:          "/meeting-documents",
		Tags:          tags,
		Summary:       "Delete a meeting document",
		Description:   "The bucket is picked from type. Needs fileHandler:documents:delete (fileHandler:files:delete for SRD).",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		Type documents.MeetingType `query:"type" required:"true"`
		Key  string                `query:"key"  required:"true" doc:"The file's id."`
	},
	) (*struct{}, error) {
		if err := svc.Delete(ctx, string(input.Type), input.Key); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-requirement-profiles",
		Method:      http.MethodGet,
		Path:        "/requirement-profiles",
		Tags:        tags,
		Summary:     "List requirement profiles",
		Description: "One year's requirement profiles (kravprofiler), by folder. Needs fileHandler:files:read.",
	}, func(ctx context.Context, input *struct {
		Year int `query:"year" required:"true"`
	},
	) (*struct {
		Body []documents.RequirementProfileFolder
	}, error,
	) {
		folders, err := svc.ListRequirements(ctx, input.Year)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct {
			Body []documents.RequirementProfileFolder
		}{Body: folders}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-requirement-profile",
		Method:        http.MethodPost,
		Path:          "/requirement-profiles",
		Tags:          tags,
		Summary:       "Upload a requirement profile",
		Description:   "Into public/kravprofiler/{year}/{folder}. Needs fileHandler:files:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			Year   int           `form:"year"   required:"true"`
			Folder string        `form:"folder" doc:"Usually the committee or position."`
			Name   string        `form:"name"   doc:"File name without extension; the uploaded file's extension is kept."`
			File   huma.FormFile `form:"file"   required:"true"`
		}]
	},
	) (*storedFileOutput, error) {
		data := input.RawBody.Data()
		file := documents.UploadFile{Filename: data.File.Filename, Data: data.File}
		stored, err := svc.Upload(
			ctx,
			documents.UploadRequirement,
			data.Year,
			data.Folder,
			data.Name,
			file,
		)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &storedFileOutput{Body: *stored}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-requirement-profile",
		Method:        http.MethodDelete,
		Path:          "/requirement-profiles",
		Tags:          tags,
		Summary:       "Delete a requirement profile",
		Description:   "Needs fileHandler:files:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		Key string `query:"key" required:"true" doc:"The file's id."`
	},
	) (*struct{}, error) {
		if err := svc.DeleteRequirement(ctx, input.Key); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	files := []string{"Files"}

	huma.Register(api, huma.Operation{
		OperationID: "list-files",
		Method:      http.MethodGet,
		Path:        "/files",
		Tags:        files,
		Summary:     "List miscellaneous files",
		Description: "Files under public/miscellaneous in the files bucket (the admin file browser). Needs fileHandler:files:read.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []documents.StoredFile }, error) {
		all, err := svc.ListMisc(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []documents.StoredFile }{Body: all}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "upload-file",
		Method:        http.MethodPost,
		Path:          "/files",
		Tags:          files,
		Summary:       "Upload a miscellaneous file",
		Description:   "Needs fileHandler:files:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		RawBody huma.MultipartFormFiles[struct {
			Prefix string        `form:"prefix" required:"false" doc:"Subfolder under public/miscellaneous; / if empty."`
			Name   string        `form:"name" required:"false"   doc:"File name; a random one if empty."`
			File   huma.FormFile `form:"file"   required:"true"`
		}]
	},
	) (*storedFileOutput, error) {
		data := input.RawBody.Data()
		name := data.Name
		if name == "" {
			name = uuid.NewString()
		}
		file := documents.UploadFile{Filename: data.File.Filename, Data: data.File}
		result, err := svc.UploadMisc(ctx, data.Prefix, name, file)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &storedFileOutput{Body: *result}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-file",
		Method:        http.MethodDelete,
		Path:          "/files",
		Tags:          files,
		Summary:       "Delete a miscellaneous file",
		Description:   "Needs fileHandler:files:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		Key string `query:"key" required:"true" doc:"The file's id."`
	},
	) (*struct{}, error) {
		if err := svc.DeleteMisc(ctx, input.Key); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	// SvelteKit's /dcompassen/2026 proxies here and sets its own headers
	// (content type, CSP sandbox).
	huma.Register(api, huma.Operation{
		OperationID: "get-file",
		Method:      http.MethodGet,
		Path:        "/files/{name}",
		Tags:        files,
		Summary:     "Download a miscellaneous file",
		Description: "The raw bytes of public/miscellaneous/{name}. Signed-in members only.",
		Responses:   rawResponses("application/octet-stream", "The file."),
	}, func(ctx context.Context, input *struct {
		Name string `path:"name" doc:"File name directly under public/miscellaneous."`
	},
	) (*rawOutput, error) {
		data, err := svc.GetMisc(ctx, input.Name)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &rawOutput{ContentType: "application/octet-stream", Body: data}, nil
	})
}
