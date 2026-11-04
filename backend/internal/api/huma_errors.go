package api

import (
	"errors"
	"log/slog"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/backend/internal/adminsettings"
	"github.com/dsek-lth/web/backend/internal/alerts"
	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/booking"
	"github.com/dsek-lth/web/backend/internal/cafe"
	"github.com/dsek-lth/web/backend/internal/comments"
	"github.com/dsek-lth/web/backend/internal/committees"
	"github.com/dsek-lth/web/backend/internal/documents"
	"github.com/dsek-lth/web/backend/internal/doors"
	"github.com/dsek-lth/web/backend/internal/elections"
	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/governingdocs"
	"github.com/dsek-lth/web/backend/internal/links"
	"github.com/dsek-lth/web/backend/internal/markdown"
	"github.com/dsek-lth/web/backend/internal/medals"
	"github.com/dsek-lth/web/backend/internal/members"
	"github.com/dsek-lth/web/backend/internal/nollning"
	"github.com/dsek-lth/web/backend/internal/notifications"
	"github.com/dsek-lth/web/backend/internal/pings"
	"github.com/dsek-lth/web/backend/internal/readme"
	"github.com/dsek-lth/web/backend/internal/search"
	"github.com/dsek-lth/web/backend/internal/songs"
	"github.com/dsek-lth/web/backend/internal/tickets"
)

// notFound names what each domain's ErrNotFound means, for the 404 detail.
var notFound = []struct {
	err  error
	what string
}{
	{articles.ErrNotFound, "article"},
	{events.ErrNotFound, "event"},
	{members.ErrNotFound, "member"},
	{committees.ErrNotFound, "committee, position or mandate"},
	{nollning.ErrNotFound, "nollning season or phadder group"},
	{songs.ErrNotFound, "song or songbook entry"},
	{alerts.ErrNotFound, "alert"},
	{markdown.ErrNotFound, "info page"},
	{governingdocs.ErrNotFound, "governing document"},
	{booking.ErrNotFound, "booking request, bookable or category"},
	{elections.ErrNotFound, "election"},
	{cafe.ErrNotFound, "cafe shift"},
	{notifications.ErrNotFound, "notification"},
	{doors.ErrNotFound, "door or door access policy"},
	{adminsettings.ErrNotFound, "admin setting"},
	{links.ErrNotFound, "link"},
	{pings.ErrNotFound, "member"},
	{medals.ErrNotFound, "member"},
	{documents.ErrNotFound, "file"},
	{readme.ErrNotFound, "readme issue"},
	{accesspolicies.ErrNotFound, "access policy"},
	{tickets.ErrNotFound, "ticket release"},
	{tickets.ErrEntryNotFound, "ticket request"},
}

// invalidInput is every domain's "the request is well-formed but breaks a
// rule" error. They answer 422, like huma's own validation errors.
var invalidInput = []error{
	articles.ErrInvalidInput,
	events.ErrInvalidInput,
	members.ErrInvalidInput,
	committees.ErrInvalidInput,
	accesspolicies.ErrInvalidInput,
	nollning.ErrInvalidInput,
	songs.ErrInvalidInput,
	alerts.ErrInvalidInput,
	markdown.ErrInvalidInput,
	governingdocs.ErrInvalidInput,
	booking.ErrInvalidInput,
	elections.ErrInvalidInput,
	cafe.ErrInvalidInput,
	notifications.ErrInvalidInput,
	doors.ErrInvalidInput,
	adminsettings.ErrInvalidInput,
	links.ErrInvalidInput,
	pings.ErrInvalidInput,
	documents.ErrInvalidInput,
	tickets.ErrInvalidInput,
	search.ErrInvalidInput,
	comments.ErrInvalidContent,
}

// conflict is every error meaning "not possible in the current state".
var conflict = []error{
	songs.ErrPositionTaken,
	songs.ErrAlreadyInSongBook,
	tickets.ErrNotOpenYet,
	tickets.ErrOfferNotActive,
	tickets.ErrClosed,
	search.ErrSyncRunning,
}

// humaServiceError maps a domain-package error to a huma.StatusError (an
// RFC 9457 problem): 404 naming what wasn't found, 422 for invalid input
// (with the domain's own message), 409 for a state conflict, 401/403 from
// internal/auth, 503 when search isn't configured, else a logged 500.
func humaServiceError(err error) error {
	for _, nf := range notFound {
		if errors.Is(err, nf.err) {
			return huma.Error404NotFound(nf.what + " not found")
		}
	}
	for _, e := range invalidInput {
		if errors.Is(err, e) {
			return huma.Error422UnprocessableEntity(err.Error())
		}
	}
	for _, e := range conflict {
		if errors.Is(err, e) {
			return huma.Error409Conflict(err.Error())
		}
	}
	switch {
	case errors.Is(err, auth.ErrUnauthenticated):
		return huma.Error401Unauthorized("unauthenticated")
	case errors.Is(err, auth.ErrForbidden):
		return huma.Error403Forbidden("forbidden")
	case errors.Is(err, search.ErrUnavailable):
		return huma.Error503ServiceUnavailable("search is not configured")
	default:
		slog.Error("api: internal error", "err", err)
		return huma.Error500InternalServerError("internal error")
	}
}
