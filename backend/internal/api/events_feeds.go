package api

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/nollning"
)

// EventCalendarHandler serves the general ICS feed. Plain handler, not
// huma: the response is text/calendar. SvelteKit's /events/subscribe
// proxies here - calendar apps subscribe to that URL, so it must not
// change.
func EventCalendarHandler(svc *events.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeCalendar(w, r, svc, events.CalendarFeed{})
	}
}

// NollningCalendarHandler serves the nollning ICS feed (proxied by
// SvelteKit's /nollning/events/subscribe): the current season's events
// once it has been revealed, otherwise the general feed - mirroring the
// old REVEAL_LAUNCH_DATE switch. Either way capped at three months ahead,
// as before.
func NollningCalendarHandler(svc *events.Service, nollningSvc *nollning.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		endsBefore := time.Now().AddDate(0, 3, 0)
		feed := events.CalendarFeed{EndsBefore: &endsBefore}
		phase, err := nollningSvc.Phase(r.Context())
		if err != nil {
			log.Printf("nollning calendar: phase: %v", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		if phase == nollning.PhasePostReveal {
			season, err := nollningSvc.Current(r.Context())
			if err != nil {
				log.Printf("nollning calendar: current season: %v", err)
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			if season != nil {
				feed.NollningSeasonID = season.ID
			}
		}
		writeCalendar(w, r, svc, feed)
	}
}

func writeCalendar(
	w http.ResponseWriter,
	r *http.Request,
	svc *events.Service,
	feed events.CalendarFeed,
) {
	ics, err := svc.CalendarICS(r.Context(), feed)
	if err != nil {
		log.Printf("calendar: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="D-sektionen_events.ics"`)
	_, _ = w.Write(ics)
}

// EventAlarmHandler answers "true" while an alarm-flagged event is running,
// "false" otherwise. Plain text, proxied by SvelteKit's /api/alarm.
func EventAlarmHandler(svc *events.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		active, err := svc.AlarmActive(r.Context())
		if err != nil {
			log.Printf("alarm: %v", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		if active {
			_, _ = w.Write([]byte("true"))
		} else {
			_, _ = w.Write([]byte("false"))
		}
	}
}

type eventSlugByIDInput struct {
	ID string `path:"id"`
}

type eventSlugByIDOutput struct {
	Body struct {
		Slug string `json:"slug"`
	}
}

func registerEventLegacyRoutes(api huma.API, svc *events.Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-event-slug-by-id",
		Method:      http.MethodGet,
		Path:        "/events/by-id/{id}",
		Summary:     "Look up an event's slug from its id (for legacy /events/id/{id} links)",
	}, func(ctx context.Context, input *eventSlugByIDInput) (*eventSlugByIDOutput, error) {
		eventSlug, err := svc.SlugForID(ctx, input.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := &eventSlugByIDOutput{}
		out.Body.Slug = eventSlug
		return out, nil
	})
}
