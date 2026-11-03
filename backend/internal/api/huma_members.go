// See huma_articles.go's package doc comment - same huma/code-first
// pattern, applied to the member directory/profile (backend/DESIGN.md's
// roadmap "Phase 1: directory foundation").
package api

import (
	"context"
	"io"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/members"
)

type listMembersInput struct {
	ClassYear      int32  `query:"classYear"`
	ClassProgramme string `query:"classProgramme"`
}

type listMembersOutput struct {
	Body []members.MemberProfile
}

type getMemberInput struct {
	StudentID string `path:"studentId"`
}

type memberOutput struct {
	Body members.MemberProfile
}

type updateMemberProfileInput struct {
	StudentID string `path:"studentId"`
	Body      members.UpdateProfileInput
}

type updateFoodPreferenceInput struct {
	StudentID string `path:"studentId"`
	Body      struct {
		FoodPreference *string `json:"foodPreference,omitempty"`
	}
}

// registerMemberRoutes registers the member directory/profile endpoints.
// Deliberately not here (see backend/DESIGN.md's roadmap): avatar upload,
// medals, ping, door access, subscription settings, and the board page
// (Phase 2, bundled with the nollning staben redesign).
func registerMemberRoutes(api huma.API, svc *members.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-members",
		Method:      http.MethodGet,
		Path:        "/members",
		Summary:     "List members, optionally filtered by classYear/classProgramme",
	}, func(ctx context.Context, input *listMembersInput) (*listMembersOutput, error) {
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
		return &listMembersOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-member",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}",
		Summary:     "Get a member's full profile",
	}, func(ctx context.Context, input *getMemberInput) (*memberOutput, error) {
		member, err := svc.Profile(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-member-profile",
		Method:      http.MethodPatch,
		Path:        "/members/{studentId}",
		Summary:     "Replace a member's profile fields (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateMemberProfileInput) (*memberOutput, error) {
		member, err := svc.UpdateProfile(ctx, input.StudentID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-member-food-preference",
		Method:      http.MethodPatch,
		Path:        "/members/{studentId}/food-preference",
		Summary:     "Replace a member's food preference",
	}, func(ctx context.Context, input *updateFoodPreferenceInput) (*memberOutput, error) {
		member, err := svc.UpdateFoodPreference(ctx, input.StudentID, input.Body.FoodPreference)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &memberOutput{Body: *member}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "update-member-language",
		Method:        http.MethodPatch,
		Path:          "/members/{studentId}/language",
		Summary:       "Set a member's preferred site language",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *updateLanguageInput) (*struct{}, error) {
		if err := svc.UpdateLanguage(ctx, input.StudentID, input.Body.Language); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "upload-member-picture",
		Method:      http.MethodPut,
		Path:        "/members/{studentId}/picture",
		Summary:     "Upload a member's profile picture and make it their avatar",
		Description: "The image should already be cropped (the web app crops to 400x400 WebP). " +
			"Replaces and deletes the previous picture.",
	}, func(ctx context.Context, input *uploadMemberPictureInput) (*memberPictureOutput, error) {
		f := input.RawBody.Data().Image
		data, err := io.ReadAll(io.LimitReader(f, members.MaxPictureSize+1))
		if err != nil {
			return nil, huma.Error400BadRequest("could not read the picture")
		}
		url, err := svc.UploadPicture(ctx, input.StudentID, data)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &memberPictureOutput{}
		out.Body.PicturePath = url
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-member-picture",
		Method:        http.MethodDelete,
		Path:          "/members/{studentId}/picture",
		Summary:       "Remove a member's profile picture",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *studentIDPathInput) (*struct{}, error) {
		if err := svc.RemovePicture(ctx, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}

type uploadMemberPictureInput struct {
	StudentID string `path:"studentId"`
	RawBody   huma.MultipartFormFiles[struct {
		Image huma.FormFile `form:"image" required:"true"`
	}]
}

type memberPictureOutput struct {
	Body struct {
		PicturePath string `json:"picturePath"`
	}
}

type updateLanguageInput struct {
	StudentID string `path:"studentId"`
	Body      struct {
		Language string `json:"language" enum:"sv,en"`
	}
}

type studentIDPathInput struct {
	StudentID string `path:"studentId"`
}
