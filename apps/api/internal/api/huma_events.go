package api

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/events"
)

type listEventsInput struct {
	Search           string      `query:"search"           doc:"Free-text search over title and description."`
	Tags             []string    `query:"tags,explode"     doc:"Tag ids; an event matches if it has any of them."`
	Span             events.Span `query:"span"             doc:"upcoming (default): ends after now, soonest first. past: started before now, newest first. range: overlaps [from, to), soonest first."`
	From             time.Time   `query:"from"             doc:"Start of the range span (inclusive)."`
	To               time.Time   `query:"to"               doc:"End of the range span (exclusive)."`
	IncludeDeleted   bool        `query:"includeDeleted"   doc:"Also list soft-deleted events. Needs event:update."`
	NollningSeasonID string      `query:"nollningSeasonId" doc:"Only events in this nollning season."`
	IncludeNollning  bool        `query:"includeNollning"  doc:"Also list nollning season events, which are left out unless nollningSeasonId is set."`
	Paging
}

type getEventInput struct {
	Slug           string `path:"slug"`
	IncludeDeleted bool   `            query:"includeDeleted" doc:"Also return a soft-deleted event, to someone who may edit it."`
}

type eventOutput struct {
	Body events.EventDetail
}

type EventScopeParams struct {
	Slug  string           `path:"slug"`
	Scope events.EditScope `            query:"scope" doc:"For an occurrence of a recurring series: THIS (default) only this one, FUTURE this and later ones, ALL every one."`
}

func editScope(scope events.EditScope) events.EditScope {
	if scope == "" {
		return events.EditScopeThis
	}
	return scope
}

func registerEventRoutes(api huma.API, svc *events.Service) {
	tags := []string{"Events"}

	huma.Register(api, huma.Operation{
		OperationID: "list-events",
		Method:      http.MethodGet,
		Path:        "/events",
		Tags:        tags,
		Summary:     "List events",
		Description: "Non-deleted events in a time window (span). An event is in the window if any part of it overlaps it. Nollning season events are left out unless includeNollning or nollningSeasonId is set. pageSize defaults to 10.",
	}, func(ctx context.Context, input *listEventsInput) (*struct{ Body events.EventList }, error) {
		params := events.ListParams{
			TagIDs:         input.Tags,
			Span:           input.Span,
			IncludeRemoved: input.IncludeDeleted,
			Page:           input.Page,
			PageSize:       input.PageSize,
		}
		if !input.From.IsZero() {
			params.From = &input.From
		}
		if !input.To.IsZero() {
			params.To = &input.To
		}
		if input.Search != "" {
			params.Search = &input.Search
		}
		if input.NollningSeasonID != "" {
			params.NollningSeasonID = &input.NollningSeasonID
		}
		params.IncludeNollning = input.IncludeNollning

		items, pageCount, err := svc.List(ctx, params)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body events.EventList }{
			Body: events.EventList{Events: items, PageCount: pageCount},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-event",
		Method:      http.MethodGet,
		Path:        "/events/{slug}",
		Tags:        tags,
		Summary:     "Get an event",
		Description: "A non-deleted event, with its comments, attendees and recurring series.",
	}, func(ctx context.Context, input *getEventInput) (*eventOutput, error) {
		var (
			event *events.EventDetail
			err   error
		)
		if input.IncludeDeleted {
			event, err = svc.GetDeleted(ctx, input.Slug)
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
		Tags:          tags,
		Summary:       "Create an event",
		Description:   "Needs event:create. With recurring set, creates every occurrence of the series as its own event and returns the first.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct{ Body events.EventInput }) (*eventOutput, error) {
		event, err := svc.Create(ctx, input.Body)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &eventOutput{Body: *event}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-event",
		Method:      http.MethodPut,
		Path:        "/events/{slug}",
		Tags:        tags,
		Summary:     "Replace an event",
		Description: "Replaces every field. Needs event:update, or being its author. " +
			"With scope FUTURE or ALL, every affected occurrence gets the new content and " +
			"start/end time of day, but keeps its own date. recurring is ignored.",
	}, func(ctx context.Context, input *struct {
		EventScopeParams
		Body events.EventInput
	},
	) (*eventOutput, error) {
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
		Tags:          tags,
		Summary:       "Delete an event",
		Description:   "Soft delete; scope works as for replace. Needs event:delete.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *EventScopeParams) (*struct{}, error) {
		if err := svc.Delete(ctx, input.Slug, editScope(input.Scope)); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "set-event-attendance",
		Method:        http.MethodPut,
		Path:          "/events/{slug}/attendance",
		Tags:          tags,
		Summary:       "Set your attendance",
		Description:   "The signed-in member's going/interested status. The organizer is notified.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug"`
		Body events.AttendanceInput
	},
	) (*struct{}, error) {
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
		Tags:          tags,
		Summary:       "Comment on an event",
		Description:   "As the signed-in member. Needs event:comment.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *struct {
		Slug string `path:"slug"`
		Body apitypes.CommentInput
	},
	) (*commentOutput, error) {
		comment, err := svc.AddComment(ctx, input.Slug, input.Body.Content)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &commentOutput{Body: *comment}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-event-comment",
		Method:        http.MethodDelete,
		Path:          "/events/{slug}/comments/{commentId}",
		Tags:          tags,
		Summary:       "Delete an event comment",
		Description:   "Needs event:comment:delete, or being the comment's author.",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, input *deleteCommentInput) (*struct{}, error) {
		if err := svc.RemoveComment(ctx, input.Slug, input.CommentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})
}
