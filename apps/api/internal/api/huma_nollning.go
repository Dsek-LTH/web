package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/nollning"
)

type phadderGroupMemberPath struct {
	ID        string `path:"id"        doc:"Phadder group id."`
	StudentID string `path:"studentId"`
}

type phadderGroupMembersInput struct {
	IDPath
	Body nollning.PhadderGroupMembersInput
}

func registerNollningRoutes(api huma.API, svc *nollning.Service) {
	tags := []string{"Nollning"}

	huma.Register(api, huma.Operation{
		OperationID: "get-nollning-status",
		Method:      http.MethodGet,
		Path:        "/nollning/current",
		Tags:        tags,
		Summary:     "Get the nollning phase",
		Description: "The current phase and active season, which the frontend uses for theming and routing.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body nollning.NollningStatus }, error) {
		current, err := svc.GetCurrent(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.NollningStatus }{Body: *current}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-nollning-seasons",
		Method:      http.MethodGet,
		Path:        "/nollning/seasons",
		Tags:        tags,
		Summary:     "List nollning seasons",
		Description: "Every season, newest first.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []nollning.NollningSeason }, error) {
		items, err := svc.ListSeasons(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []nollning.NollningSeason }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-nollning-season",
		Method:        http.MethodPost,
		Path:          "/nollning/seasons",
		Tags:          tags,
		Summary:       "Create a nollning season",
		Description:   "Needs nollning:season:manage.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body nollning.NollningSeasonInput }) (*struct{ Body nollning.NollningSeason }, error) {
		season, err := svc.CreateSeason(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.NollningSeason }{Body: *season}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-nollning-season",
		Method:      http.MethodPut,
		Path:        "/nollning/seasons/{id}",
		Tags:        tags,
		Summary:     "Replace a nollning season",
		Description: "Needs nollning:season:manage.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body nollning.NollningSeasonInput
	},
	) (*struct{ Body nollning.NollningSeason }, error) {
		season, err := svc.UpdateSeason(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.NollningSeason }{Body: *season}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-phadder-groups",
		Method:      http.MethodGet,
		Path:        "/nollning/phadder-groups",
		Tags:        tags,
		Summary:     "List phadder groups",
		Description: "With how many nollor and phaddrar each has.",
	}, func(ctx context.Context, input *struct {
		SeasonID string `query:"seasonId" doc:"Only groups in this season."`
	},
	) (*struct{ Body []nollning.PhadderGroup }, error) {
		var seasonID *string
		if input.SeasonID != "" {
			seasonID = &input.SeasonID
		}
		items, err := svc.ListGroups(ctx, seasonID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []nollning.PhadderGroup }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-phadder-group",
		Method:      http.MethodGet,
		Path:        "/nollning/phadder-groups/{id}",
		Tags:        tags,
		Summary:     "Get a phadder group",
		Description: "With its nollor and phaddrar. Needs a signed-in member.",
	}, func(ctx context.Context, input *IDPath) (*struct{ Body nollning.PhadderGroup }, error) {
		group, err := svc.GetGroup(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.PhadderGroup }{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-phadder-group",
		Method:        http.MethodPost,
		Path:          "/nollning/phadder-groups",
		Tags:          tags,
		Summary:       "Create a phadder group",
		Description:   "Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body nollning.PhadderGroupInput }) (*struct{ Body nollning.PhadderGroup }, error) {
		group, err := svc.CreateGroup(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.PhadderGroup }{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-phadder-group",
		Method:      http.MethodPut,
		Path:        "/nollning/phadder-groups/{id}",
		Tags:        tags,
		Summary:     "Replace a phadder group",
		Description: "Needs nollning:phaddrar:groups:manage.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body nollning.PhadderGroupInput
	},
	) (*struct{ Body nollning.PhadderGroup }, error) {
		group, err := svc.UpdateGroup(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.PhadderGroup }{Body: *group}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-phadder-group",
		Method:        http.MethodDelete,
		Path:          "/nollning/phadder-groups/{id}",
		Tags:          tags,
		Summary:       "Delete a phadder group",
		Description:   "Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.DeleteGroup(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "add-phadder-group-nollor",
		Method:        http.MethodPost,
		Path:          "/nollning/phadder-groups/{id}/nollor",
		Tags:          tags,
		Summary:       "Add nollor to a phadder group",
		Description:   "Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *phadderGroupMembersInput) (*struct{}, error) {
		if err := svc.AddNollor(ctx, input.ID, input.Body.StudentIDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "remove-phadder-group-nolla",
		Method:        http.MethodDelete,
		Path:          "/nollning/phadder-groups/{id}/nollor/{studentId}",
		Tags:          tags,
		Summary:       "Remove a nolla from a phadder group",
		Description:   "Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *phadderGroupMemberPath) (*struct{}, error) {
		if err := svc.RemoveNolla(ctx, input.ID, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "add-phadder-group-phaddrar",
		Method:        http.MethodPost,
		Path:          "/nollning/phadder-groups/{id}/phaddrar",
		Tags:          tags,
		Summary:       "Add phaddrar to a phadder group",
		Description:   "Ties each member's active phadder or uppdrag mandate for the group's season to the group; 422 naming anyone without one. Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *phadderGroupMembersInput) (*struct{}, error) {
		if err := svc.AddPhaddrar(ctx, input.ID, input.Body.StudentIDs); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "remove-phadder-group-phadder",
		Method:        http.MethodDelete,
		Path:          "/nollning/phadder-groups/{id}/phaddrar/{studentId}",
		Tags:          tags,
		Summary:       "Remove a phadder from a phadder group",
		Description:   "Needs nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *phadderGroupMemberPath) (*struct{}, error) {
		if err := svc.RemovePhadder(ctx, input.ID, input.StudentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "set-member-phadder-group",
		Method:        http.MethodPut,
		Path:          "/members/{studentId}/phadder-group",
		Tags:          tags,
		Summary:       "Set a member's phadder group",
		Description:   "Puts the member in a phadder group of the current season as a nolla, or takes them out of their group when groupId is omitted; 422 for a group outside the current season. The member themselves, or nollning:phaddrar:groups:manage.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		StudentIDPath
		Body nollning.MemberPhadderGroupInput
	},
	) (*struct{}, error) {
		if err := svc.SetMemberGroup(ctx, input.StudentID, input.Body.GroupID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-member-phadder-role",
		Method:      http.MethodGet,
		Path:        "/members/{studentId}/phadder-role",
		Tags:        tags,
		Summary:     "Get a member's phadder role",
		Description: "Whether the member is a nolla or phadder this season, and in which group. Needs a signed-in member.",
	}, func(ctx context.Context, input *StudentIDPath) (*struct{ Body nollning.MemberPhadderRole }, error) {
		role, groupID, err := svc.PhadderRoleFor(ctx, input.StudentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body nollning.MemberPhadderRole }{
			Body: nollning.MemberPhadderRole{Role: role, GroupID: groupID},
		}, nil
	})
}
