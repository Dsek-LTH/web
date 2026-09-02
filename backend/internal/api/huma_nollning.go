// See huma_articles.go's package doc comment - same huma/code-first
// pattern, applied to internal/nollning (backend/DESIGN.md's roadmap
// "Phase 2: nollning redesign").
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/nollning"
)

type currentNollningOutput struct {
	Body nollning.CurrentInfo
}

type listSeasonsOutput struct {
	Body []nollning.Season
}

type createSeasonInput struct {
	Body nollning.SeasonInput
}

type updateSeasonInput struct {
	ID   string `path:"id"`
	Body nollning.SeasonInput
}

type seasonOutput struct {
	Body nollning.Season
}

type listGroupsInput struct {
	SeasonID string `query:"seasonId"`
}

type listGroupsOutput struct {
	Body []nollning.PhadderGroup
}

type getGroupInput struct {
	ID string `path:"id"`
}

type groupOutput struct {
	Body nollning.PhadderGroup
}

type createGroupInput struct {
	Body nollning.PhadderGroupInput
}

type updateGroupInput struct {
	ID   string `path:"id"`
	Body nollning.PhadderGroupInput
}

type deleteGroupInput struct {
	ID string `path:"id"`
}

type groupMemberInput struct {
	ID   string `path:"id"`
	Body struct {
		MemberID string `json:"memberId"`
	}
}

type deleteGroupMemberInput struct {
	ID       string `path:"id"`
	MemberID string `path:"memberId"`
}

type phadderRoleInput struct {
	StudentID string `path:"studentId"`
}

type phadderRoleOutput struct {
	Body nollning.PhadderRoleInfo
}

func registerNollningRoutes(api huma.API, svc *nollning.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-current-nollning",
		Method:      http.MethodGet,
		Path:        "/nollning/current",
		Summary:     "Get the current nollning phase and active season, if any",
	}, func(ctx context.Context, _ *struct{}) (*currentNollningOutput, error) {
		current, err := svc.GetCurrent(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &currentNollningOutput{Body: *current}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-nollning-seasons",
		Method:      http.MethodGet,
		Path:        "/nollning/seasons",
		Summary:     "List every nollning season",
	}, func(ctx context.Context, _ *struct{}) (*listSeasonsOutput, error) {
		items, err := svc.ListSeasons(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listSeasonsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-nollning-season",
		Method:        http.MethodPost,
		Path:          "/nollning/seasons",
		Summary:       "Create a nollning season",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createSeasonInput) (*seasonOutput, error) {
		season, err := svc.CreateSeason(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &seasonOutput{Body: *season}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-nollning-season",
		Method:      http.MethodPatch,
		Path:        "/nollning/seasons/{id}",
		Summary:     "Replace a nollning season's fields",
	}, func(ctx context.Context, input *updateSeasonInput) (*seasonOutput, error) {
		season, err := svc.UpdateSeason(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &seasonOutput{Body: *season}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-phadder-groups",
		Method:      http.MethodGet,
		Path:        "/nollning/groups",
		Summary:     "List phadder groups, optionally filtered by seasonId",
	}, func(ctx context.Context, input *listGroupsInput) (*listGroupsOutput, error) {
		var seasonID *string
		if input.SeasonID != "" {
			seasonID = &input.SeasonID
		}
		items, err := svc.ListGroups(ctx, seasonID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listGroupsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-phadder-group",
		Method:      http.MethodGet,
		Path:        "/nollning/groups/{id}",
		Summary:     "Get a phadder group with its nollor and phaddrar",
	}, func(ctx context.Context, input *getGroupInput) (*groupOutput, error) {
		group, err := svc.GetGroup(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &groupOutput{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-phadder-group",
		Method:        http.MethodPost,
		Path:          "/nollning/groups",
		Summary:       "Create a phadder group",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createGroupInput) (*groupOutput, error) {
		group, err := svc.CreateGroup(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &groupOutput{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-phadder-group",
		Method:      http.MethodPatch,
		Path:        "/nollning/groups/{id}",
		Summary:     "Replace a phadder group's fields",
	}, func(ctx context.Context, input *updateGroupInput) (*groupOutput, error) {
		group, err := svc.UpdateGroup(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &groupOutput{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-phadder-group",
		Method:        http.MethodDelete,
		Path:          "/nollning/groups/{id}",
		Summary:       "Delete a phadder group",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteGroupInput) (*struct{}, error) {
		if err := svc.DeleteGroup(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "add-nolla",
		Method:        http.MethodPost,
		Path:          "/nollning/groups/{id}/nollor",
		Summary:       "Add a member to a phadder group as a nolla",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *groupMemberInput) (*struct{}, error) {
		if err := svc.AddNolla(ctx, input.ID, input.Body.MemberID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "remove-nolla",
		Method:        http.MethodDelete,
		Path:          "/nollning/groups/{id}/nollor/{memberId}",
		Summary:       "Remove a member from a phadder group's nollor",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteGroupMemberInput) (*struct{}, error) {
		if err := svc.RemoveNolla(ctx, input.ID, input.MemberID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "add-phadder",
		Method:        http.MethodPost,
		Path:          "/nollning/groups/{id}/phaddrar",
		Summary:       "Tag a member's active phadder/uppdrag mandate to a phadder group",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *groupMemberInput) (*struct{}, error) {
		if err := svc.AddPhadder(ctx, input.ID, input.Body.MemberID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "remove-phadder",
		Method:        http.MethodDelete,
		Path:          "/nollning/groups/{id}/phaddrar/{memberId}",
		Summary:       "Untag a member's mandate(s) from a phadder group",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteGroupMemberInput) (*struct{}, error) {
		if err := svc.RemovePhadder(ctx, input.ID, input.MemberID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-phadder-role",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/phadder-role",
		Summary:     "Get a member's PhadderRole (nolla/phadder/none) for the current season",
	}, func(ctx context.Context, input *phadderRoleInput) (*phadderRoleOutput, error) {
		role, groupID, err := svc.PhadderRoleFor(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &phadderRoleOutput{Body: nollning.PhadderRoleInfo{Role: role, GroupID: groupID}}, nil
	})
}
