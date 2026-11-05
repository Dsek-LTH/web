package api

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/events"
	"github.com/dsek-lth/web/apps/api/internal/nollning"
)

// rawOutput is a non-JSON response body (ICS, CSV, file bytes).
type rawOutput struct {
	ContentType        string `header:"Content-Type"`
	ContentDisposition string `header:"Content-Disposition"`
	Body               []byte
}

// rawResponses documents a raw-body operation's 200 response as
// contentType rather than JSON.
func rawResponses(contentType, description string) map[string]*huma.Response {
	return map[string]*huma.Response{
		"200": {
			Description: description,
			Content: map[string]*huma.MediaType{
				contentType: {Schema: &huma.Schema{Type: huma.TypeString}},
			},
		},
	}
}

// Alarm says whether the alarm should be going off.
type Alarm struct {
	Active bool `json:"active" doc:"Whether an alarm-flagged event is running right now."`
}

func registerEventFeedRoutes(api huma.API, svc *events.Service, nollningSvc *nollning.Service) {
	// SvelteKit's /events/subscribe proxies here - calendar apps subscribe
	// to that URL, so it must not change; this one may.
	huma.Register(api, huma.Operation{
		OperationID: "get-events-calendar",
		Method:      http.MethodGet,
		Path:        "/events.ics",
		Tags:        []string{"Events"},
		Summary:     "Events as an ICS calendar feed",
		Description: "Every event not tied to a nollning season.",
		Responses:   rawResponses("text/calendar", "An iCalendar file."),
	}, func(ctx context.Context, _ *struct{}) (*rawOutput, error) {
		return calendar(ctx, svc, events.CalendarFeed{})
	})

	// Proxied by SvelteKit's /nollning/events/subscribe.
	huma.Register(api, huma.Operation{
		OperationID: "get-nollning-events-calendar",
		Method:      http.MethodGet,
		Path:        "/nollning/events.ics",
		Tags:        []string{"Events"},
		Summary:     "Nollning events as an ICS calendar feed",
		Description: "The current season's events once it has been revealed, otherwise the " +
			"general feed - mirroring the old REVEAL_LAUNCH_DATE switch. Either way at most " +
			"three months ahead.",
		Responses: rawResponses("text/calendar", "An iCalendar file."),
	}, func(ctx context.Context, _ *struct{}) (*rawOutput, error) {
		endsBefore := time.Now().AddDate(0, 3, 0)
		feed := events.CalendarFeed{EndsBefore: &endsBefore}
		phase, err := nollningSvc.Phase(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		if phase == nollning.PhasePostReveal {
			season, err := nollningSvc.Current(ctx)
			if err != nil {
				return nil, humaServiceError(err)
			}
			if season != nil {
				feed.NollningSeasonID = season.ID
			}
		}
		return calendar(ctx, svc, feed)
	})

	// Proxied by SvelteKit's /api/alarm, which answers "true"/"false".
	huma.Register(api, huma.Operation{
		OperationID: "get-alarm",
		Method:      http.MethodGet,
		Path:        "/alarm",
		Tags:        []string{"Events"},
		Summary:     "Whether an alarm event is running",
		Description: "True while an event with alarmActive set is under way.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body Alarm }, error) {
		active, err := svc.AlarmActive(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body Alarm }{Body: Alarm{Active: active}}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-event-slug",
		Method:      http.MethodGet,
		Path:        "/events/by-id/{id}",
		Tags:        []string{"Events"},
		Summary:     "Look up an event's slug from its id",
		Description: "For legacy /events/id/{id} links. Gives the event a slug first if it has none.",
	}, func(ctx context.Context, input *struct {
		ID string `path:"id" doc:"Event id (UUID)."`
	},
	) (*struct{ Body EventSlug }, error) {
		eventSlug, err := svc.SlugForID(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body EventSlug }{Body: EventSlug{Slug: eventSlug}}, nil
	})
}

// EventSlug is an event's URL key.
type EventSlug struct {
	Slug string `json:"slug"`
}

func calendar(
	ctx context.Context,
	svc *events.Service,
	feed events.CalendarFeed,
) (*rawOutput, error) {
	ics, err := svc.CalendarICS(ctx, feed)
	if err != nil {
		return nil, humaServiceError(err)
	}
	return &rawOutput{
		ContentType:        "text/calendar; charset=utf-8",
		ContentDisposition: `attachment; filename="D-sektionen_events.ics"`,
		Body:               ics,
	}, nil
}
