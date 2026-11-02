package api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/tickets"
)

// Free-ticket releases (internal/tickets). Listing and reading a release
// is public; requesting/accepting/cancelling acts as the signed-in member;
// creating needs webshop:create, editing and the roster webshop:manage.

type TicketRelease struct {
	ID                 string    `json:"id"`
	EventID            string    `json:"eventId"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	Location           string    `json:"location"`
	Quantity           int       `json:"quantity"`
	OpensAt            time.Time `json:"opensAt"`
	ClosesAt           time.Time `json:"closesAt"`
	ExpiresAt          time.Time `json:"expiresAt"`
	GraceWindowSeconds int       `json:"graceWindowSeconds"`
	OfferWindowSeconds int       `json:"offerWindowSeconds"`
	Status             string    `json:"status"`
}

func toTicketRelease(r tickets.Release) TicketRelease {
	return TicketRelease{
		ID: r.ID, EventID: r.EventID, Title: r.Title, Description: r.Description,
		Location: r.Location, Quantity: r.Quantity, OpensAt: r.OpensAt,
		ClosesAt: r.ClosesAt, ExpiresAt: r.ExpiresAt,
		GraceWindowSeconds: r.GraceWindowSeconds, OfferWindowSeconds: r.OfferWindowSeconds,
		Status: r.Status,
	}
}

// TicketReleaseSummary is the public shape of a release: what it is, when
// it opens/closes/draws, and how many tickets are claimed.
type TicketReleaseSummary struct {
	ID          string    `json:"id"`
	EventID     string    `json:"eventId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	OpensAt     time.Time `json:"opensAt"`
	ClosesAt    time.Time `json:"closesAt"`
	ExpiresAt   time.Time `json:"expiresAt"`
	LotteryAt   time.Time `json:"lotteryAt"`
	Status      string    `json:"status"`
	Quantity    int       `json:"quantity"`
	Claimed     int       `json:"claimed"`
	Accepted    int       `json:"accepted"`
	Waitlisted  int       `json:"waitlisted"`
}

func toTicketReleaseSummary(r tickets.Release, c tickets.Counts) TicketReleaseSummary {
	return TicketReleaseSummary{
		ID: r.ID, EventID: r.EventID, Title: r.Title, Description: r.Description,
		Location: r.Location, OpensAt: r.OpensAt, ClosesAt: r.ClosesAt,
		ExpiresAt: r.ExpiresAt, LotteryAt: r.LotteryAt(), Status: r.Status,
		Quantity: c.Quantity, Claimed: c.Claimed, Accepted: c.Accepted,
		Waitlisted: c.Waitlisted,
	}
}

type TicketQueueEntry struct {
	Status         string     `json:"status"`
	QueuePosition  *int       `json:"queuePosition,omitempty"`
	OfferExpiresAt *time.Time `json:"offerExpiresAt,omitempty"`
}

func toTicketQueueEntry(e tickets.QueueEntry) TicketQueueEntry {
	return TicketQueueEntry{
		Status: e.Status, QueuePosition: e.QueuePosition, OfferExpiresAt: e.OfferExpiresAt,
	}
}

type MyTicket struct {
	ReleaseID    string `json:"releaseId"`
	ReleaseTitle string `json:"releaseTitle"`
	TicketQueueEntry
}

type TicketRosterEntry struct {
	StudentID      string    `json:"studentId"`
	FirstName      *string   `json:"firstName,omitempty"`
	LastName       *string   `json:"lastName,omitempty"`
	Nickname       *string   `json:"nickname,omitempty"`
	PicturePath    *string   `json:"picturePath,omitempty"`
	FoodPreference *string   `json:"foodPreference,omitempty"`
	RequestedAt    time.Time `json:"requestedAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type ticketReleaseIDInput struct {
	ID string `path:"id"`
}

type createTicketReleaseInput struct {
	Body struct {
		EventID     string    `json:"eventId"     doc:"UUID of the event this release is for"`
		Title       string    `json:"title"`
		Description string    `json:"description,omitempty"`
		Location    string    `json:"location,omitempty" doc:"Room name, not a maps location"`
		Quantity    int       `json:"quantity"    minimum:"1"`
		OpensAt     time.Time `json:"opensAt"`
		ClosesAt    time.Time `json:"closesAt"    doc:"After this time, no new requests are accepted"`
	}
}

type updateTicketReleaseInput struct {
	ID   string `path:"id"`
	Body struct {
		Title       string    `json:"title"`
		Description string    `json:"description,omitempty"`
		Location    string    `json:"location,omitempty"`
		Quantity    int       `json:"quantity" minimum:"1"`
		ClosesAt    time.Time `json:"closesAt"`
	}
}

type listTicketReleasesInput struct {
	IncludeExpired bool `query:"includeExpired" doc:"also list releases whose event is over; requires webshop:create"`
}

// ticketServiceError maps internal/tickets' errors, falling back to the
// shared mapping (auth errors, 500).
func ticketServiceError(err error) error {
	switch {
	case errors.Is(err, tickets.ErrNotFound), errors.Is(err, tickets.ErrEntryNotFound):
		return huma.Error404NotFound(err.Error())
	case errors.Is(err, tickets.ErrInvalidInput):
		return huma.Error400BadRequest(err.Error())
	case errors.Is(err, tickets.ErrNotOpenYet),
		errors.Is(err, tickets.ErrOfferNotActive),
		errors.Is(err, tickets.ErrClosed):
		return huma.Error409Conflict(err.Error())
	default:
		return humaServiceError(err)
	}
}

func registerTicketRoutes(api huma.API, svc *tickets.Service, scheduler *tickets.Scheduler) {
	huma.Register(api, huma.Operation{
		OperationID:   "create-ticket-release",
		Method:        http.MethodPost,
		Path:          "/ticket-releases",
		Summary:       "Create a free-ticket release for an event (webshop:create)",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *createTicketReleaseInput) (*struct{ Body TicketRelease }, error) {
		r, err := svc.CreateRelease(ctx, tickets.CreateReleaseInput{
			EventID: in.Body.EventID, Title: in.Body.Title, Description: in.Body.Description,
			Location: in.Body.Location, Quantity: in.Body.Quantity, OpensAt: in.Body.OpensAt,
			ClosesAt: in.Body.ClosesAt,
		})
		if err != nil {
			return nil, ticketServiceError(err)
		}
		scheduler.ArmLottery(r)
		return &struct{ Body TicketRelease }{Body: toTicketRelease(r)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-ticket-releases",
		Method:      http.MethodGet,
		Path:        "/ticket-releases",
		Summary:     "List free-ticket releases, newest first",
	}, func(ctx context.Context, in *listTicketReleasesInput) (*struct{ Body []TicketReleaseSummary }, error) {
		all, err := svc.ListReleases(ctx, in.IncludeExpired)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		ids := make([]string, len(all))
		for i, r := range all {
			ids[i] = r.ID
		}
		counts, err := svc.GetCountsForReleases(ctx, ids)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		out := make([]TicketReleaseSummary, len(all))
		for i, r := range all {
			out[i] = toTicketReleaseSummary(r, counts[r.ID])
		}
		return &struct{ Body []TicketReleaseSummary }{Body: out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-ticket-release",
		Method:      http.MethodGet,
		Path:        "/ticket-releases/{id}",
		Summary:     "Get a free-ticket release with its counts",
	}, func(ctx context.Context, in *ticketReleaseIDInput) (*struct{ Body TicketReleaseSummary }, error) {
		r, err := svc.GetRelease(ctx, in.ID)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		c, err := svc.GetCounts(ctx, r.ID)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		return &struct{ Body TicketReleaseSummary }{Body: toTicketReleaseSummary(r, c)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-ticket-release",
		Method:      http.MethodPatch,
		Path:        "/ticket-releases/{id}",
		Summary:     "Edit a release after publishing (webshop:manage)",
	}, func(ctx context.Context, in *updateTicketReleaseInput) (*struct{ Body TicketRelease }, error) {
		r, err := svc.UpdateRelease(ctx, in.ID, tickets.UpdateReleaseInput{
			Title: in.Body.Title, Description: in.Body.Description, Location: in.Body.Location,
			Quantity: in.Body.Quantity, ClosesAt: in.Body.ClosesAt,
		})
		if err != nil {
			return nil, ticketServiceError(err)
		}
		return &struct{ Body TicketRelease }{Body: toTicketRelease(r)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-ticket-roster",
		Method:      http.MethodGet,
		Path:        "/ticket-releases/{id}/roster",
		Summary:     "Everyone with a confirmed ticket (webshop:manage)",
	}, func(ctx context.Context, in *ticketReleaseIDInput) (*struct{ Body []TicketRosterEntry }, error) {
		roster, err := svc.ListRoster(ctx, in.ID)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		out := make([]TicketRosterEntry, len(roster))
		for i, e := range roster {
			out[i] = TicketRosterEntry(e)
		}
		return &struct{ Body []TicketRosterEntry }{Body: out}, nil
	})

	memberAction := func(
		op, method, path, summary string,
		fn func(ctx context.Context, releaseID, studentID string) (*tickets.QueueEntry, error),
	) {
		huma.Register(api, huma.Operation{
			OperationID: op, Method: method, Path: path, Summary: summary,
		}, func(ctx context.Context, in *ticketReleaseIDInput) (*struct{ Body *TicketQueueEntry }, error) {
			studentID, err := tickets.ActingStudentID(ctx)
			if err != nil {
				return nil, ticketServiceError(err)
			}
			e, err := fn(ctx, in.ID, studentID)
			if err != nil {
				return nil, ticketServiceError(err)
			}
			if e == nil {
				return &struct{ Body *TicketQueueEntry }{}, nil
			}
			body := toTicketQueueEntry(*e)
			return &struct{ Body *TicketQueueEntry }{Body: &body}, nil
		})
	}
	memberAction("request-ticket", http.MethodPost, "/ticket-releases/{id}/request",
		"Request a ticket as the signed-in member",
		func(ctx context.Context, id, sid string) (*tickets.QueueEntry, error) {
			e, err := svc.RequestTicket(ctx, id, sid)
			return &e, err
		})
	memberAction("accept-ticket-offer", http.MethodPost, "/ticket-releases/{id}/accept",
		"Accept the signed-in member's ticket offer",
		func(ctx context.Context, id, sid string) (*tickets.QueueEntry, error) {
			if err := svc.Accept(ctx, id, sid); err != nil {
				return nil, err
			}
			e, err := svc.Status(ctx, id, sid)
			return &e, err
		})
	memberAction("cancel-ticket-request", http.MethodDelete, "/ticket-releases/{id}/request",
		"Withdraw the signed-in member's request, offer or waitlist spot",
		func(ctx context.Context, id, sid string) (*tickets.QueueEntry, error) {
			return nil, svc.Cancel(ctx, id, sid)
		})
	memberAction("ticket-status", http.MethodGet, "/ticket-releases/{id}/status",
		"The signed-in member's place in a release's queue",
		func(ctx context.Context, id, sid string) (*tickets.QueueEntry, error) {
			e, err := svc.Status(ctx, id, sid)
			return &e, err
		})

	huma.Register(api, huma.Operation{
		OperationID: "my-tickets",
		Method:      http.MethodGet,
		Path:        "/tickets/mine",
		Summary:     "Every queue entry the signed-in member has had, newest first",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []MyTicket }, error) {
		studentID, err := tickets.ActingStudentID(ctx)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		entries, err := svc.ListEntriesForMember(ctx, studentID)
		if err != nil {
			return nil, ticketServiceError(err)
		}
		out := make([]MyTicket, len(entries))
		for i, e := range entries {
			out[i] = MyTicket{
				ReleaseID: e.ReleaseID, ReleaseTitle: e.ReleaseTitle,
				TicketQueueEntry: toTicketQueueEntry(e.QueueEntry),
			}
		}
		return &struct{ Body []MyTicket }{Body: out}, nil
	})
}
