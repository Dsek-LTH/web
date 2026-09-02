// See huma_articles.go's package doc comment - same huma/code-first
// pattern, applied to events.
package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/events"
)

type listEventsInput struct {
	Search           string   `query:"search"           doc:"free-text search over title/description"`
	Tags             []string `query:"tags,explode"     doc:"tag UUIDs, ANY-match"`
	Past             bool     `query:"past"             doc:"list past events (ended) instead of upcoming ones"`
	NollningSeasonID string   `query:"nollningSeasonId"`
	Page             int      `query:"page"             doc:"1-based"`
	PageSize         int      `query:"pageSize"`
}

type listEventsOutput struct {
	Body struct {
		Events    []events.EventSummary `json:"events"`
		PageCount int                   `json:"pageCount"`
	}
}

type getEventInput struct {
	Slug   string `path:"slug"`
	Status string `            query:"status" enum:"any" doc:"pass 'any' to bypass the removed filter, for an editor viewing a soft-removed event"`
}

type eventOutput struct {
	Body events.EventDetail
}

type createEventInput struct {
	Body events.EventInput
}

type updateEventInput struct {
	Slug  string `path:"slug"`
	Scope string `            query:"scope" enum:"THIS,FUTURE,ALL" doc:"how a recurring series is affected; defaults to THIS"`
	Body  events.EventInput
}

type deleteEventInput struct {
	Slug  string `path:"slug"`
	Scope string `            query:"scope" enum:"THIS,FUTURE,ALL" doc:"how a recurring series is affected; defaults to THIS"`
}

type setAttendanceInput struct {
	Slug string `path:"slug"`
	Body struct {
		Status string `json:"status" enum:"going,interested,none"`
	}
}

type createEventCommentInput struct {
	Slug string `path:"slug"`
	Body struct {
		Content string `json:"content"`
	}
}

type eventCommentOutput struct {
	Body events.Comment
}

type deleteEventCommentInput struct {
	Slug      string `path:"slug"`
	CommentID string `path:"commentId"`
}

func editScope(raw string) events.EditScope {
	if raw == "" {
		return events.EditScopeThis
	}
	return events.EditScope(raw)
}

// registerEventRoutes registers every event/comment/attendance operation -
// same auth story as registerArticleRoutes: mutating operations call
// auth.Require via internal/events.Service, reading the acting identity
// from context (auth.Middleware, wired in router.go).
func registerEventRoutes(api huma.API, svc *events.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-events",
		Method:      http.MethodGet,
		Path:        "/events",
		Summary:     "List events",
	}, func(ctx context.Context, input *listEventsInput) (*listEventsOutput, error) {
		params := events.ListParams{
			TagIDs:   input.Tags,
			Past:     input.Past,
			Page:     input.Page,
			PageSize: input.PageSize,
		}
		if input.Search != "" {
			params.Search = &input.Search
		}
		if input.NollningSeasonID != "" {
			params.NollningSeasonID = &input.NollningSeasonID
		}

		items, pageCount, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &listEventsOutput{}
		out.Body.Events = items
		out.Body.PageCount = pageCount
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-event",
		Method:      http.MethodGet,
		Path:        "/events/{slug}",
		Summary:     "Get an event by slug",
	}, func(ctx context.Context, input *getEventInput) (*eventOutput, error) {
		var (
			event *events.EventDetail
			err   error
		)
		if input.Status == "any" {
			event, err = svc.GetAny(ctx, input.Slug)
		} else {
			event, err = svc.Get(ctx, input.Slug)
		}
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &eventOutput{Body: *event}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-event",
		Method:        http.MethodPost,
		Path:          "/events",
		Summary:       "Create an event, or a recurring series if Body.recurring is set",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createEventInput) (*eventOutput, error) {
		event, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &eventOutput{Body: *event}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-event",
		Method:      http.MethodPatch,
		Path:        "/events/{slug}",
		Summary:     "Replace an event (full-replace, not a partial patch)",
	}, func(ctx context.Context, input *updateEventInput) (*eventOutput, error) {
		event, err := svc.Update(ctx, input.Slug, input.Body, editScope(input.Scope))
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &eventOutput{Body: *event}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-event",
		Method:        http.MethodDelete,
		Path:          "/events/{slug}",
		Summary:       "Soft-delete an event",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteEventInput) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug, editScope(input.Scope)); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "set-event-attendance",
		Method:        http.MethodPatch,
		Path:          "/events/{slug}/attendance",
		Summary:       "Set the acting member's going/interested/none status",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *setAttendanceInput) (*struct{}, error) {
		var err error
		switch input.Body.Status {
		case "going":
			err = svc.SetGoing(ctx, input.Slug)
		case "interested":
			err = svc.SetInterested(ctx, input.Slug)
		default:
			err = svc.ClearAttendance(ctx, input.Slug)
		}
		if err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-event-comment",
		Method:        http.MethodPost,
		Path:          "/events/{slug}/comments",
		Summary:       "Comment on an event as the acting member",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createEventCommentInput) (*eventCommentOutput, error) {
		comment, err := svc.AddComment(ctx, input.Slug, input.Body.Content)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &eventCommentOutput{Body: *comment}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-event-comment",
		Method:        http.MethodDelete,
		Path:          "/events/{slug}/comments/{commentId}",
		Summary:       "Delete a comment",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteEventCommentInput) (*struct{}, error) {
		if err := svc.RemoveComment(ctx, input.Slug, input.CommentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
