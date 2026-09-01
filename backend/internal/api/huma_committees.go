// See huma_articles.go's package doc comment - same huma/code-first
// pattern, applied to committees/positions/mandates (backend/DESIGN.md's
// roadmap "Phase 1: directory foundation").
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/committees"
)

type listCommitteesOutput struct {
	Body []committees.Committee
}

type getCommitteeInput struct {
	ShortName string `path:"shortName"`
	Year      int32  `                 query:"year" doc:"defaults to the current year"`
}

type committeeDetailOutput struct {
	Body committees.CommitteeDetail
}

type updateCommitteeInput struct {
	ShortName string `path:"shortName"`
	Body      committees.UpdateCommitteeInput
}

type committeeOutput struct {
	Body committees.Committee
}

type updateMarkdownInput struct {
	ShortName string `path:"shortName"`
	Body      committees.UpdateMarkdownInput
}

type markdownOutput struct {
	Body committees.MarkdownContent
}

type listPositionsOutput struct {
	Body []committees.Position
}

type getPositionInput struct {
	ID   string `path:"id"`
	Year int32  `          query:"year" doc:"defaults to the current year"`
}

type positionDetailOutput struct {
	Body committees.PositionDetail
}

type updatePositionInput struct {
	ID   string `path:"id"`
	Body committees.UpdatePositionInput
}

type positionOutput struct {
	Body committees.Position
}

type createMandatesInput struct {
	PositionID string `path:"positionId"`
	Body       committees.CreateMandateInput
}

type mandatesOutput struct {
	Body []committees.Mandate
}

type updateMandateInput struct {
	ID   string `path:"id"`
	Body committees.UpdateMandateInput
}

type mandateOutput struct {
	Body committees.Mandate
}

type deleteMandateInput struct {
	ID string `path:"id"`
}

func yearOrCurrent(year int32) int32 {
	if year == 0 {
		return committees.CurrentYear()
	}
	return year
}

// registerCommitteeRoutes registers every committee/position/mandate
// operation. Deliberately not here (see backend/DESIGN.md's roadmap): the
// board page and its SEE_STABEN staben-hiding logic - Phase 2, bundled
// with the nollning redesign.
func registerCommitteeRoutes(api huma.API, svc *committees.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-committees",
		Method:      http.MethodGet,
		Path:        "/committees",
		Summary:     "List committees with descriptions/images and currently-active mandate/member counts",
	}, func(ctx context.Context, _ *struct{}) (*listCommitteesOutput, error) {
		items, err := svc.ListCommittees(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listCommitteesOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-committee",
		Method:      http.MethodGet,
		Path:        "/committees/{shortName}",
		Summary:     "Get a committee's positions (for the given year, default current), mandates, and about/links content",
	}, func(ctx context.Context, input *getCommitteeInput) (*committeeDetailOutput, error) {
		detail, err := svc.GetByShortName(ctx, input.ShortName, yearOrCurrent(input.Year))
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &committeeDetailOutput{Body: *detail}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-committee",
		Method:      http.MethodPatch,
		Path:        "/committees/{shortName}",
		Summary:     "Replace a committee's descriptions/images/banner",
	}, func(ctx context.Context, input *updateCommitteeInput) (*committeeOutput, error) {
		committee, err := svc.UpdateCommittee(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &committeeOutput{Body: *committee}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-committee-markdown",
		Method:      http.MethodPut,
		Path:        "/committees/{shortName}/markdown",
		Summary:     "Replace a committee's about-text",
	}, func(ctx context.Context, input *updateMarkdownInput) (*markdownOutput, error) {
		content, err := svc.UpdateCommitteeMarkdown(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &markdownOutput{Body: *content}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-committee-links",
		Method:      http.MethodPut,
		Path:        "/committees/{shortName}/links",
		Summary:     "Replace a committee's sidebar links content",
	}, func(ctx context.Context, input *updateMarkdownInput) (*markdownOutput, error) {
		content, err := svc.UpdateCommitteeLinks(ctx, input.ShortName, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &markdownOutput{Body: *content}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-positions",
		Method:      http.MethodGet,
		Path:        "/positions",
		Summary:     "List every position",
	}, func(ctx context.Context, _ *struct{}) (*listPositionsOutput, error) {
		items, err := svc.ListPositions(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &listPositionsOutput{Body: items}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-position",
		Method:      http.MethodGet,
		Path:        "/positions/{id}",
		Summary:     "Get a position's mandates (for the given year, default current) and email aliases",
	}, func(ctx context.Context, input *getPositionInput) (*positionDetailOutput, error) {
		detail, err := svc.GetPosition(ctx, input.ID, yearOrCurrent(input.Year))
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &positionDetailOutput{Body: *detail}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-position",
		Method:      http.MethodPatch,
		Path:        "/positions/{id}",
		Summary:     "Replace a position's fields and active/boardMember flags",
	}, func(ctx context.Context, input *updatePositionInput) (*positionOutput, error) {
		position, err := svc.UpdatePosition(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &positionOutput{Body: *position}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-mandates",
		Method:        http.MethodPost,
		Path:          "/positions/{positionId}/mandates",
		Summary:       "Create a mandate on this position for each of the given memberIds",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createMandatesInput) (*mandatesOutput, error) {
		mandates, err := svc.CreateMandates(ctx, input.PositionID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &mandatesOutput{Body: mandates}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-mandate",
		Method:      http.MethodPatch,
		Path:        "/mandates/{id}",
		Summary:     "Replace a mandate's start/end dates",
	}, func(ctx context.Context, input *updateMandateInput) (*mandateOutput, error) {
		mandate, err := svc.UpdateMandate(ctx, input.ID, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &mandateOutput{Body: *mandate}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-mandate",
		Method:        http.MethodDelete,
		Path:          "/mandates/{id}",
		Summary:       "Delete a mandate",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteMandateInput) (*struct{}, error) {
		if err := svc.DeleteMandate(ctx, input.ID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
