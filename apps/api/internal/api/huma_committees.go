package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/committees"
)

type ShortNamePath struct {
	ShortName string `path:"shortName" doc:"The committee's short name, e.g. cafe."`
}

type IDPath struct {
	ID string `path:"id"`
}

type committeeMarkdownInput struct {
	ShortNamePath
	Body committees.CommitteeMarkdownInput
}

func yearOrCurrent(year int32) int32 {
	if year == 0 {
		return committees.CurrentYear()
	}
	return year
}

func registerCommitteeRoutes(api huma.API, svc *committees.Service) {
	tags := []string{"Committees"}

	huma.Register(api, huma.Operation{
		OperationID: "list-committees",
		Method:      http.MethodGet,
		Path:        "/committees",
		Tags:        tags,
		Summary:     "List committees",
		Description: "Every committee, with how many active mandates and members it has.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []committees.Committee }, error) {
		items, err := svc.ListCommittees(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []committees.Committee }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-committee",
		Method:      http.MethodGet,
		Path:        "/committees/{shortName}",
		Tags:        tags,
		Summary:     "Get a committee",
		Description: "The committee page: its positions and their mandates for one year, and its about and links text.",
	}, func(ctx context.Context, input *struct {
		ShortNamePath
		Year int32 `query:"year" doc:"Defaults to the current year."`
	},
	) (*struct{ Body committees.CommitteeDetail }, error) {
		detail, err := svc.GetByShortName(ctx, input.ShortName, yearOrCurrent(input.Year))
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.CommitteeDetail }{Body: *detail}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-committee",
		Method:      http.MethodPut,
		Path:        "/committees/{shortName}",
		Tags:        tags,
		Summary:     "Replace a committee",
		Description: "Names, descriptions, images and banner. Needs core:committee:update.",
	}, func(ctx context.Context, input *struct {
		ShortNamePath
		Body committees.CommitteeInput
	},
	) (*struct{ Body committees.Committee }, error) {
		committee, err := svc.UpdateCommittee(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.Committee }{Body: *committee}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-committee-about",
		Method:      http.MethodPut,
		Path:        "/committees/{shortName}/about",
		Tags:        tags,
		Summary:     "Replace a committee's about text",
		Description: "Needs core:committee:update.",
	}, func(ctx context.Context, input *committeeMarkdownInput) (*struct{ Body committees.CommitteeMarkdown }, error) {
		content, err := svc.UpdateCommitteeMarkdown(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.CommitteeMarkdown }{Body: *content}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-committee-links",
		Method:      http.MethodPut,
		Path:        "/committees/{shortName}/links",
		Tags:        tags,
		Summary:     "Replace a committee's sidebar links",
		Description: "Markdown. Needs core:committee:update.",
	}, func(ctx context.Context, input *committeeMarkdownInput) (*struct{ Body committees.CommitteeMarkdown }, error) {
		content, err := svc.UpdateCommitteeLinks(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.CommitteeMarkdown }{Body: *content}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-positions",
		Method:      http.MethodGet,
		Path:        "/positions",
		Tags:        tags,
		Summary:     "List positions",
		Description: "Every position, active or not.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []committees.Position }, error) {
		items, err := svc.ListPositions(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []committees.Position }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-board",
		Method:      http.MethodGet,
		Path:        "/board",
		Tags:        tags,
		Summary:     "List the board",
		Description: "Every active board position with its current holder, in display order. " +
			"During a nollning season, the organizing committee's positions are left out " +
			"unless the caller has member:see_staben.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []committees.BoardPosition }, error) {
		items, err := svc.ListBoard(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []committees.BoardPosition }{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-position",
		Method:      http.MethodGet,
		Path:        "/positions/{id}",
		Tags:        tags,
		Summary:     "Get a position",
		Description: "With its full mandate history and email aliases.",
	}, func(ctx context.Context, input *IDPath) (*struct{ Body committees.PositionDetail }, error) {
		detail, err := svc.GetPosition(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.PositionDetail }{Body: *detail}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-position",
		Method:      http.MethodPut,
		Path:        "/positions/{id}",
		Tags:        tags,
		Summary:     "Replace a position",
		Description: "Needs core:position:update.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body committees.PositionInput
	},
	) (*struct{ Body committees.Position }, error) {
		position, err := svc.UpdatePosition(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.Position }{Body: *position}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-mandates",
		Method:        http.MethodPost,
		Path:          "/positions/{id}/mandates",
		Tags:          tags,
		Summary:       "Create mandates",
		Description:   "One mandate on this position per member. Needs core:mandate:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		IDPath
		Body committees.MandatesInput
	},
	) (*struct{ Body []committees.Mandate }, error) {
		mandates, err := svc.CreateMandates(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body []committees.Mandate }{Body: mandates}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-mandate-dates",
		Method:      http.MethodPut,
		Path:        "/mandates/{id}",
		Tags:        tags,
		Summary:     "Replace a mandate's dates",
		Description: "Needs core:mandate:update.",
	}, func(ctx context.Context, input *struct {
		IDPath
		Body committees.MandateDatesInput
	},
	) (*struct{ Body committees.Mandate }, error) {
		mandate, err := svc.UpdateMandate(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body committees.Mandate }{Body: *mandate}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-mandate",
		Method:        http.MethodDelete,
		Path:          "/mandates/{id}",
		Tags:          tags,
		Summary:       "Delete a mandate",
		Description:   "Needs core:mandate:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *IDPath) (*struct{}, error) {
		if err := svc.DeleteMandate(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
