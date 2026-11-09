package api

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/tickets"
)

// Free-ticket releases (internal/tickets). Listing and reading a release
// is public; requesting/accepting/cancelling acts as the signed-in member;
// creating needs webshop:create, editing and the roster webshop:manage.

// TicketReleaseStatus is where a release is: before or after its lottery.
type TicketReleaseStatus string

func (TicketReleaseStatus) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "TicketReleaseStatus",
		tickets.ReleaseStatusScheduled, tickets.ReleaseStatusLotteryDone)
}

// TicketRequestStatus is where a member's request in a release's queue is.
type TicketRequestStatus string

func (TicketRequestStatus) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "TicketRequestStatus",
		tickets.EntryStatusPending, tickets.EntryStatusGranted, tickets.EntryStatusWaitlisted,
		tickets.EntryStatusAccepted, tickets.EntryStatusExpired, tickets.EntryStatusCancelled)
}

// TicketRelease is a release as its editor sees it.
type TicketRelease struct {
	ID                 string              `json:"id"`
	EventID            string              `json:"eventId"            doc:"The event the tickets are for."`
	Title              string              `json:"title"`
	Description        string              `json:"description"`
	Location           string              `json:"location"           doc:"Room name, not a maps location."`
	Quantity           int                 `json:"quantity"           doc:"Number of tickets."`
	OpensAt            time.Time           `json:"opensAt"            doc:"When requests open."`
	ClosesAt           time.Time           `json:"closesAt"           doc:"When requests close."`
	ExpiresAt          time.Time           `json:"expiresAt"          doc:"The event's end; the release is hidden after."`
	GraceWindowSeconds int                 `json:"graceWindowSeconds" doc:"Requests in the first this many seconds after opening are drawn by lottery; later ones queue in order."`
	OfferWindowSeconds int                 `json:"offerWindowSeconds" doc:"How long a waitlisted member has to accept an offered ticket."`
	Status             TicketReleaseStatus `json:"status"`
}

func toTicketRelease(r tickets.Release) TicketRelease {
	return TicketRelease{
		ID: r.ID, EventID: r.EventID, Title: r.Title, Description: r.Description,
		Location: r.Location, Quantity: r.Quantity, OpensAt: r.OpensAt,
		ClosesAt: r.ClosesAt, ExpiresAt: r.ExpiresAt,
		GraceWindowSeconds: r.GraceWindowSeconds, OfferWindowSeconds: r.OfferWindowSeconds,
		Status: TicketReleaseStatus(r.Status),
	}
}

// TicketReleaseSummary is the public shape of a release: what it is, when
// it opens/closes/draws, and how many tickets are claimed.
type TicketReleaseSummary struct {
	ID          string              `json:"id"`
	EventID     string              `json:"eventId"     doc:"The event the tickets are for."`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Location    string              `json:"location"    doc:"Room name, not a maps location."`
	OpensAt     time.Time           `json:"opensAt"     doc:"When requests open."`
	ClosesAt    time.Time           `json:"closesAt"    doc:"When requests close."`
	ExpiresAt   time.Time           `json:"expiresAt"   doc:"The event's end; the release is hidden after."`
	LotteryAt   time.Time           `json:"lotteryAt"   doc:"When the lottery among early requests is drawn."`
	Status      TicketReleaseStatus `json:"status"`
	Quantity    int                 `json:"quantity"    doc:"Number of tickets."`
	Claimed     int                 `json:"claimed"     doc:"Tickets offered or accepted."`
	Accepted    int                 `json:"accepted"    doc:"Tickets accepted."`
	Waitlisted  int                 `json:"waitlisted"  doc:"Members waiting for a ticket."`
}

func toTicketReleaseSummary(r tickets.Release, c tickets.Counts) TicketReleaseSummary {
	return TicketReleaseSummary{
		ID: r.ID, EventID: r.EventID, Title: r.Title, Description: r.Description,
		Location: r.Location, OpensAt: r.OpensAt, ClosesAt: r.ClosesAt,
		ExpiresAt: r.ExpiresAt, LotteryAt: r.LotteryAt(), Status: TicketReleaseStatus(r.Status),
		Quantity: c.Quantity, Claimed: c.Claimed, Accepted: c.Accepted,
		Waitlisted: c.Waitlisted,
	}
}

// TicketQueueEntry is a member's request in a release's queue.
type TicketQueueEntry struct {
	Status         TicketRequestStatus `json:"status"                   doc:"granted: offered a ticket, to accept before offerExpiresAt. accepted: has a ticket."`
	QueuePosition  *int                `json:"queuePosition,omitempty"  doc:"Place on the waitlist, from 0 (the next in line)."`
	OfferExpiresAt *time.Time          `json:"offerExpiresAt,omitempty" doc:"When a granted offer lapses."`
}

func toTicketQueueEntry(e tickets.QueueEntry) TicketQueueEntry {
	return TicketQueueEntry{
		Status: TicketRequestStatus(
			e.Status,
		),
		QueuePosition:  e.QueuePosition,
		OfferExpiresAt: e.OfferExpiresAt,
	}
}

// MemberTicket is one of the signed-in member's ticket requests.
type MemberTicket struct {
	ReleaseID    string `json:"releaseId"`
	ReleaseTitle string `json:"releaseTitle"`
	TicketQueueEntry
}

// TicketRosterEntry is a member with a confirmed ticket.
type TicketRosterEntry struct {
	StudentID      string    `json:"studentId"`
	FirstName      *string   `json:"firstName,omitempty"`
	LastName       *string   `json:"lastName,omitempty"`
	Nickname       *string   `json:"nickname,omitempty"`
	PicturePath    *string   `json:"picturePath,omitempty"    doc:"Profile picture URL."`
	FoodPreference *string   `json:"foodPreference,omitempty" doc:"Free text, e.g. allergies."`
	RequestedAt    time.Time `json:"requestedAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CreateTicketReleaseInput is a new release.
type CreateTicketReleaseInput struct {
	EventID     string    `json:"eventId"               doc:"The event the tickets are for. The release expires when it ends."`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Location    string    `json:"location,omitempty"    doc:"Room name, not a maps location."`
	Quantity    int       `json:"quantity"              doc:"Number of tickets."                                               minimum:"1"`
	OpensAt     time.Time `json:"opensAt"               doc:"When requests open."`
	ClosesAt    time.Time `json:"closesAt"              doc:"When requests close."`
}

// UpdateTicketReleaseInput is what can change after a release is created.
type UpdateTicketReleaseInput struct {
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Location    string    `json:"location,omitempty"    doc:"Room name, not a maps location."`
	Quantity    int       `json:"quantity"              doc:"Number of tickets."              minimum:"1"`
	ClosesAt    time.Time `json:"closesAt"              doc:"When requests close."`
}

func registerTicketRoutes(api huma.API, svc *tickets.Service, scheduler *tickets.Scheduler) {
	tags := []string{"Tickets"}

	huma.Register(api, huma.Operation{
		OperationID:   "create-ticket-release",
		Method:        http.MethodPost,
		Path:          "/ticket-releases",
		Tags:          tags,
		Summary:       "Create a ticket release",
		Description:   "Free tickets for an event. Needs webshop:create.",
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *struct{ Body CreateTicketReleaseInput }) (*struct{ Body TicketRelease }, error) {
		r, err := svc.CreateRelease(ctx, tickets.CreateReleaseInput{
			EventID: in.Body.EventID, Title: in.Body.Title, Description: in.Body.Description,
			Location: in.Body.Location, Quantity: in.Body.Quantity, OpensAt: in.Body.OpensAt,
			ClosesAt: in.Body.ClosesAt,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		scheduler.ArmLottery(r)
		return &struct{ Body TicketRelease }{Body: toTicketRelease(r)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-ticket-releases",
		Method:      http.MethodGet,
		Path:        "/ticket-releases",
		Tags:        tags,
		Summary:     "List ticket releases",
		Description: "Newest first, with their counts.",
	}, func(ctx context.Context, in *struct {
		IncludeExpired bool `query:"includeExpired" doc:"Also list releases whose event is over. Needs webshop:create."`
	},
	) (*struct{ Body []TicketReleaseSummary }, error) {
		all, err := svc.ListReleases(ctx, in.IncludeExpired)
		if err != nil {
			return nil, humaServiceError(err)
		}
		ids := make([]string, len(all))
		for i, r := range all {
			ids[i] = r.ID
		}
		counts, err := svc.GetCountsForReleases(ctx, ids)
		if err != nil {
			return nil, humaServiceError(err)
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
		Tags:        tags,
		Summary:     "Get a ticket release",
		Description: "With its counts.",
	}, func(ctx context.Context, in *IDPath) (*struct{ Body TicketReleaseSummary }, error) {
		r, err := svc.GetRelease(ctx, in.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		c, err := svc.GetCounts(ctx, r.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body TicketReleaseSummary }{Body: toTicketReleaseSummary(r, c)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "replace-ticket-release",
		Method:      http.MethodPut,
		Path:        "/ticket-releases/{id}",
		Tags:        tags,
		Summary:     "Replace a ticket release",
		Description: "Its editable fields; the opening time and the event can't change. Needs webshop:manage.",
	}, func(ctx context.Context, in *struct {
		IDPath
		Body UpdateTicketReleaseInput
	},
	) (*struct{ Body TicketRelease }, error) {
		r, err := svc.UpdateRelease(ctx, in.ID, tickets.UpdateReleaseInput{
			Title: in.Body.Title, Description: in.Body.Description, Location: in.Body.Location,
			Quantity: in.Body.Quantity, ClosesAt: in.Body.ClosesAt,
		})
		if err != nil {
			return nil, humaServiceError(err)
		}
		return &struct{ Body TicketRelease }{Body: toTicketRelease(r)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-ticket-roster",
		Method:      http.MethodGet,
		Path:        "/ticket-releases/{id}/roster",
		Tags:        tags,
		Summary:     "List a release's ticket holders",
		Description: "Everyone with a confirmed ticket, with their food preferences. Needs webshop:manage.",
	}, func(ctx context.Context, in *IDPath) (*struct{ Body []TicketRosterEntry }, error) {
		roster, err := svc.ListRoster(ctx, in.ID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := make([]TicketRosterEntry, len(roster))
		for i, e := range roster {
			out[i] = TicketRosterEntry(e)
		}
		return &struct{ Body []TicketRosterEntry }{Body: out}, nil
	})

	memberAction := func(
		op huma.Operation,
		fn func(ctx context.Context, releaseID, studentID string) (tickets.QueueEntry, error),
	) {
		op.Tags = tags
		huma.Register(
			api,
			op,
			func(ctx context.Context, in *IDPath) (*struct{ Body TicketQueueEntry }, error) {
				studentID, err := tickets.ActingStudentID(ctx)
				if err != nil {
					return nil, humaServiceError(err)
				}
				e, err := fn(ctx, in.ID, studentID)
				if err != nil {
					return nil, humaServiceError(err)
				}
				return &struct{ Body TicketQueueEntry }{Body: toTicketQueueEntry(e)}, nil
			},
		)
	}
	memberAction(huma.Operation{
		OperationID: "get-ticket-request",
		Method:      http.MethodGet,
		Path:        "/ticket-releases/{id}/request",
		Summary:     "Get your ticket request",
		Description: "The signed-in member's place in the release's queue. 404 if they haven't requested.",
	}, svc.Status)
	memberAction(huma.Operation{
		OperationID:   "request-ticket",
		Method:        http.MethodPost,
		Path:          "/ticket-releases/{id}/request",
		Summary:       "Request a ticket",
		Description:   "As the signed-in member. 409 before the release opens or after it closes.",
		DefaultStatus: http.StatusCreated,
	}, svc.RequestTicket)
	memberAction(huma.Operation{
		OperationID: "accept-ticket-offer",
		Method:      http.MethodPost,
		Path:        "/ticket-releases/{id}/accept",
		Summary:     "Accept a ticket offer",
		Description: "The signed-in member's granted offer. 409 if there's no active offer.",
	}, func(ctx context.Context, id, sid string) (tickets.QueueEntry, error) {
		if err := svc.Accept(ctx, id, sid); err != nil {
			return tickets.QueueEntry{}, err
		}
		return svc.Status(ctx, id, sid)
	})

	huma.Register(api, huma.Operation{
		OperationID:   "cancel-ticket-request",
		Method:        http.MethodDelete,
		Path:          "/ticket-releases/{id}/request",
		Tags:          tags,
		Summary:       "Cancel your ticket request",
		Description:   "Withdraws the signed-in member's request, offer or waitlist spot. An accepted ticket can't be cancelled (404).",
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *IDPath) (*struct{}, error) {
		studentID, err := tickets.ActingStudentID(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		if err := svc.Cancel(ctx, in.ID, studentID); err != nil {
			return nil, humaServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-my-tickets",
		Method:      http.MethodGet,
		Path:        "/me/tickets",
		Tags:        []string{"Me"},
		Summary:     "List your tickets",
		Description: "Every ticket request the signed-in member has made, newest first.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []MemberTicket }, error) {
		studentID, err := tickets.ActingStudentID(ctx)
		if err != nil {
			return nil, humaServiceError(err)
		}
		entries, err := svc.ListEntriesForMember(ctx, studentID)
		if err != nil {
			return nil, humaServiceError(err)
		}
		out := make([]MemberTicket, len(entries))
		for i, e := range entries {
			out[i] = MemberTicket{
				ReleaseID: e.ReleaseID, ReleaseTitle: e.ReleaseTitle,
				TicketQueueEntry: toTicketQueueEntry(e.QueueEntry),
			}
		}
		return &struct{ Body []MemberTicket }{Body: out}, nil
	})
}
