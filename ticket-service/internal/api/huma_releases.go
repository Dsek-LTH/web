package api

import (
	"context"
	"time"

	"github.com/Dsek-LTH/ticket-service/internal/releases"
)

type Handlers struct {
	svc       *releases.Service
	scheduler *releases.Scheduler
}

func NewHandlers(svc *releases.Service, scheduler *releases.Scheduler) *Handlers {
	return &Handlers{svc: svc, scheduler: scheduler}
}

// ---- shared response bodies ----

type ReleaseBody struct {
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

func toReleaseBody(r releases.Release) ReleaseBody {
	return ReleaseBody{
		ID:                 r.ID,
		EventID:            r.EventID,
		Title:              r.Title,
		Description:        r.Description,
		Location:           r.Location,
		Quantity:           r.Quantity,
		OpensAt:            r.OpensAt,
		ClosesAt:           r.ClosesAt,
		ExpiresAt:          r.ExpiresAt,
		GraceWindowSeconds: r.GraceWindowSeconds,
		OfferWindowSeconds: r.OfferWindowSeconds,
		Status:             r.Status,
	}
}

// ReleaseSummary is the public-facing shape for both a single release and a
// listing entry - title/description/location/counts only, nothing sensitive
// like created_by.
type ReleaseSummary struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	OpensAt     time.Time `json:"opensAt"`
	ClosesAt    time.Time `json:"closesAt"`
	Status      string    `json:"status"`
	Quantity    int       `json:"quantity"`
	Claimed     int       `json:"claimed"`
	Waitlisted  int       `json:"waitlisted"`
}

func (h *Handlers) toReleaseSummary(ctx context.Context, r releases.Release) (ReleaseSummary, error) {
	counts, err := h.svc.GetCounts(ctx, r.ID)
	if err != nil {
		return ReleaseSummary{}, err
	}
	return ReleaseSummary{
		ID:          r.ID,
		Title:       r.Title,
		Description: r.Description,
		Location:    r.Location,
		OpensAt:     r.OpensAt,
		ClosesAt:    r.ClosesAt,
		Status:      r.Status,
		Quantity:    counts.Quantity,
		Claimed:     counts.Claimed,
		Waitlisted:  counts.Waitlisted,
	}, nil
}

type QueueEntryBody struct {
	Status         string     `json:"status"`
	QueuePosition  *int       `json:"queuePosition,omitempty"`
	OfferExpiresAt *time.Time `json:"offerExpiresAt,omitempty"`
}

func toQueueEntryBody(e releases.QueueEntry) QueueEntryBody {
	return QueueEntryBody{
		Status:         e.Status,
		QueuePosition:  e.QueuePosition,
		OfferExpiresAt: e.OfferExpiresAt,
	}
}

// ---- POST /releases (admin/organizer, forwarded via SvelteKit server code) ----

type CreateReleaseInput struct {
	Body struct {
		EventID     string    `json:"eventId" doc:"UUID of the event this release is for"`
		Title       string    `json:"title"`
		Description string    `json:"description,omitempty"`
		Location    string    `json:"location,omitempty" doc:"Room name, not a maps location"`
		Quantity    int       `json:"quantity" minimum:"1"`
		OpensAt     time.Time `json:"opensAt"`
		ClosesAt    time.Time `json:"closesAt" doc:"After this time, no new requests are accepted"`
		ExpiresAt   time.Time `json:"expiresAt" doc:"Should be the linked event's end time - the release disappears from listings once this passes"`
	}
}

type ReleaseOutput struct {
	Body ReleaseBody
}

func (h *Handlers) createRelease(ctx context.Context, input *CreateReleaseInput) (*ReleaseOutput, error) {
	identity := IdentityFromContext(ctx)

	r, err := h.svc.CreateRelease(ctx, releases.CreateReleaseInput{
		EventID:     input.Body.EventID,
		Title:       input.Body.Title,
		Description: input.Body.Description,
		Location:    input.Body.Location,
		Quantity:    input.Body.Quantity,
		OpensAt:     input.Body.OpensAt,
		ClosesAt:    input.Body.ClosesAt,
		ExpiresAt:   input.Body.ExpiresAt,
		CreatedBy:   identity.MemberID,
	})
	if err != nil {
		return nil, mapServiceError(err)
	}

	h.scheduler.ArmLottery(r)

	return &ReleaseOutput{Body: toReleaseBody(r)}, nil
}

// ---- GET /releases (public listing, no auth) ----

type ListReleasesInput struct {
	IncludeExpired bool `query:"includeExpired" doc:"Admin use only (access enforced by the caller) - include releases whose linked event is over"`
}

type ListReleasesOutput struct {
	Body []ReleaseSummary
}

func (h *Handlers) listReleases(ctx context.Context, input *ListReleasesInput) (*ListReleasesOutput, error) {
	all, err := h.svc.ListReleases(ctx, input.IncludeExpired)
	if err != nil {
		return nil, mapServiceError(err)
	}
	out := make([]ReleaseSummary, 0, len(all))
	for _, r := range all {
		summary, err := h.toReleaseSummary(ctx, r)
		if err != nil {
			return nil, mapServiceError(err)
		}
		out = append(out, summary)
	}
	return &ListReleasesOutput{Body: out}, nil
}

// ---- GET /releases/{id} (public aggregate counts, no auth) ----

type GetReleaseInput struct {
	ID string `path:"id"`
}

type GetReleaseOutput struct {
	Body ReleaseSummary
}

func (h *Handlers) getRelease(ctx context.Context, input *GetReleaseInput) (*GetReleaseOutput, error) {
	r, err := h.svc.GetRelease(ctx, input.ID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	summary, err := h.toReleaseSummary(ctx, r)
	if err != nil {
		return nil, mapServiceError(err)
	}
	return &GetReleaseOutput{Body: summary}, nil
}

// ---- member actions: request / accept / cancel / status ----

type MemberActionInput struct {
	ID string `path:"id"`
}

type QueueEntryOutput struct {
	Body QueueEntryBody
}

func (h *Handlers) requestTicket(ctx context.Context, input *MemberActionInput) (*QueueEntryOutput, error) {
	identity := IdentityFromContext(ctx)
	entry, err := h.svc.RequestTicket(ctx, input.ID, identity.MemberID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	return &QueueEntryOutput{Body: toQueueEntryBody(entry)}, nil
}

func (h *Handlers) acceptOffer(ctx context.Context, input *MemberActionInput) (*QueueEntryOutput, error) {
	identity := IdentityFromContext(ctx)
	if err := h.svc.Accept(ctx, input.ID, identity.MemberID); err != nil {
		return nil, mapServiceError(err)
	}
	entry, err := h.svc.Status(ctx, input.ID, identity.MemberID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	return &QueueEntryOutput{Body: toQueueEntryBody(entry)}, nil
}

type CancelOutput struct{}

func (h *Handlers) cancelEntry(ctx context.Context, input *MemberActionInput) (*CancelOutput, error) {
	identity := IdentityFromContext(ctx)
	if err := h.svc.Cancel(ctx, input.ID, identity.MemberID); err != nil {
		return nil, mapServiceError(err)
	}
	return &CancelOutput{}, nil
}

func (h *Handlers) statusEntry(ctx context.Context, input *MemberActionInput) (*QueueEntryOutput, error) {
	identity := IdentityFromContext(ctx)
	entry, err := h.svc.Status(ctx, input.ID, identity.MemberID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	return &QueueEntryOutput{Body: toQueueEntryBody(entry)}, nil
}

// ---- GET /me/tickets (member, every entry they've ever had) ----

type MyTicketsInput struct{}

type MyTicketBody struct {
	ReleaseID    string `json:"releaseId"`
	ReleaseTitle string `json:"releaseTitle"`
	QueueEntryBody
}

type MyTicketsOutput struct {
	Body []MyTicketBody
}

func (h *Handlers) myTickets(ctx context.Context, _ *MyTicketsInput) (*MyTicketsOutput, error) {
	identity := IdentityFromContext(ctx)
	entries, err := h.svc.ListEntriesForMember(ctx, identity.MemberID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	out := make([]MyTicketBody, len(entries))
	for i, e := range entries {
		out[i] = MyTicketBody{
			ReleaseID:      e.ReleaseID,
			ReleaseTitle:   e.ReleaseTitle,
			QueueEntryBody: toQueueEntryBody(e.QueueEntry),
		}
	}
	return &MyTicketsOutput{Body: out}, nil
}

// ---- GET /releases/{id}/entries (confirmed-ticket roster for one release) ----
//
// Access control beyond "is an authenticated member" is enforced by the
// SvelteKit caller (authorize(apiNames.WEBSHOP.MANAGE, user) - the same
// policy that gates reading a member's foodPreference field in Prisma)
// before this is ever called, same as createRelease trusts its caller for
// WEBSHOP.CREATE - this service has no concept of site-wide policies itself.

type ListEntriesInput struct {
	ID string `path:"id"`
}

type EntryBody struct {
	MemberID    string    `json:"memberId"`
	RequestedAt time.Time `json:"requestedAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	QueueEntryBody
}

type ListEntriesOutput struct {
	Body []EntryBody
}

func (h *Handlers) listEntries(ctx context.Context, input *ListEntriesInput) (*ListEntriesOutput, error) {
	entries, err := h.svc.ListAcceptedEntriesForRelease(ctx, input.ID)
	if err != nil {
		return nil, mapServiceError(err)
	}
	out := make([]EntryBody, len(entries))
	for i, e := range entries {
		out[i] = EntryBody{
			MemberID:       e.MemberID,
			RequestedAt:    e.RequestedAt,
			UpdatedAt:      e.UpdatedAt,
			QueueEntryBody: toQueueEntryBody(e),
		}
	}
	return &ListEntriesOutput{Body: out}, nil
}

// ---- PATCH /releases/{id} (edit after publishing) ----

type UpdateReleaseInput struct {
	ID   string `path:"id"`
	Body struct {
		Title       string    `json:"title"`
		Description string    `json:"description,omitempty"`
		Location    string    `json:"location,omitempty"`
		Quantity    int       `json:"quantity" minimum:"1"`
		ClosesAt    time.Time `json:"closesAt"`
	}
}

func (h *Handlers) updateRelease(ctx context.Context, input *UpdateReleaseInput) (*ReleaseOutput, error) {
	r, err := h.svc.UpdateRelease(ctx, input.ID, releases.UpdateReleaseInput{
		Title:       input.Body.Title,
		Description: input.Body.Description,
		Location:    input.Body.Location,
		Quantity:    input.Body.Quantity,
		ClosesAt:    input.Body.ClosesAt,
	})
	if err != nil {
		return nil, mapServiceError(err)
	}
	return &ReleaseOutput{Body: toReleaseBody(r)}, nil
}
