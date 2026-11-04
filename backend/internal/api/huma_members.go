package api

import (
	"context"
	"io"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/members"
)

type StudentIDPath struct {
	StudentID string `path:"studentId" doc:"LU student id, e.g. ab1234cd-s."`
}

type memberOutput struct {
	Body members.MemberProfile
}

func registerMemberRoutes(api huma.API, svc *members.Service) {
	tags := []string{"Members"}

	huma.Register(api, huma.Operation{
		OperationID: "list-members",
		Method:      http.MethodGet,
		Path:        "/members",
		Tags:        tags,
		Summary:     "List members",
		Description: "Signed-in members only.",
	}, func(ctx context.Context, input *struct {
		ClassYear      int32  `query:"classYear"      doc:"Only members who started this year."`
		ClassProgramme string `query:"classProgramme" doc:"Only members in this programme, e.g. D."`
	},
	) (*struct{ Body []members.MemberProfile }, error) {
		params := members.ListParams{}
		if input.ClassYear != 0 {
			params.ClassYear = &input.ClassYear
		}
		if input.ClassProgramme != "" {
			params.ClassProgramme = &input.ClassProgramme
		}
		items, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []members.MemberProfile }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-member",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}",
		Tags:        tags,
		Summary:     "Get a member",
		Description: "The full profile with mandate history. Signed-in members only.",
	}, func(ctx context.Context, input *StudentIDPath) (*memberOutput, error) {
		member, err := svc.Profile(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-member-profile",
		Method:      http.MethodPut,
		Path:        "/members/{studentId}",
		Tags:        tags,
		Summary:     "Replace a member's profile",
		Description: "Every profile field except food preference, email and picture. " +
			"The member themselves, or core:member:update.",
	}, func(ctx context.Context, input *struct {
		StudentIDPath
		Body members.ProfileInput
	},
	) (*memberOutput, error) {
		member, err := svc.UpdateProfile(ctx, input.StudentID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-member-food-preference",
		Method:      http.MethodPut,
		Path:        "/members/{studentId}/food-preference",
		Tags:        tags,
		Summary:     "Set a member's food preference",
		Description: "The member themselves, or core:member:update.",
	}, func(ctx context.Context, input *struct {
		StudentIDPath
		Body members.FoodPreferenceInput
	},
	) (*memberOutput, error) {
		member, err := svc.UpdateFoodPreference(ctx, input.StudentID, input.Body.FoodPreference)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "set-member-language",
		Method:        http.MethodPut,
		Path:          "/members/{studentId}/language",
		Tags:          tags,
		Summary:       "Set a member's UI language",
		Description:   "What the language switcher saves. The member themselves, or core:member:update.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		StudentIDPath
		Body members.LanguageInput
	},
	) (*struct{}, error) {
		if err := svc.UpdateLanguage(
			ctx,
			input.StudentID,
			string(input.Body.Language),
		); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "set-member-picture",
		Method:      http.MethodPut,
		Path:        "/members/{studentId}/picture",
		Tags:        tags,
		Summary:     "Set a member's profile picture",
		Description: "The image should already be cropped (the web app crops to 400x400 WebP). " +
			"Replaces and deletes the previous picture. The member themselves, or core:member:update.",
	}, func(ctx context.Context, input *struct {
		StudentIDPath
		RawBody huma.MultipartFormFiles[struct {
			Image huma.FormFile `form:"image" required:"true" doc:"The cropped picture, at most 8 MB."`
		}]
	},
	) (*struct{ Body members.MemberPicture }, error) {
		f := input.RawBody.Data().Image
		data, err := io.ReadAll(io.LimitReader(f, members.MaxPictureSize+1))
		if err != nil {
			return nil, huma.Error400BadRequest("could not read the picture")
		}
		url, err := svc.UploadPicture(ctx, input.StudentID, data)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body members.MemberPicture }{
			Body: members.MemberPicture{PicturePath: url},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-member-picture",
		Method:        http.MethodDelete,
		Path:          "/members/{studentId}/picture",
		Tags:          tags,
		Summary:       "Remove a member's profile picture",
		Description:   "The member themselves, or core:member:update.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *StudentIDPath) (*struct{}, error) {
		if err := svc.RemovePicture(ctx, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
