package api

import (
	"errors"
	"log"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/backend/internal/alerts"
	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/booking"
	"github.com/dsek-lth/web/backend/internal/cafe"
	"github.com/dsek-lth/web/backend/internal/committees"
	"github.com/dsek-lth/web/backend/internal/elections"
	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/governingdocs"
	"github.com/dsek-lth/web/backend/internal/markdown"
	"github.com/dsek-lth/web/backend/internal/members"
	"github.com/dsek-lth/web/backend/internal/nollning"
	"github.com/dsek-lth/web/backend/internal/notifications"
	"github.com/dsek-lth/web/backend/internal/songs"
)

// humaServiceError maps a domain-package error to a huma.StatusError,
// mirroring writeServiceError (json.go) for the stdlib-handled routes
// during the huma migration - see ../../DESIGN.md's "Migration sequencing"
// note. Once every route is on huma, writeServiceError/json.go can be
// deleted.
func humaServiceError(err error) error {
	switch {
	case errors.Is(err, articles.ErrNotFound),
		errors.Is(err, events.ErrNotFound),
		errors.Is(err, members.ErrNotFound),
		errors.Is(err, committees.ErrNotFound),
		errors.Is(err, nollning.ErrNotFound),
		errors.Is(err, songs.ErrNotFound),
		errors.Is(err, alerts.ErrNotFound),
		errors.Is(err, markdown.ErrNotFound),
		errors.Is(err, governingdocs.ErrNotFound),
		errors.Is(err, booking.ErrNotFound),
		errors.Is(err, elections.ErrNotFound),
		errors.Is(err, cafe.ErrNotFound),
		errors.Is(err, notifications.ErrNotFound):
		return huma.Error404NotFound("not found")
	case errors.Is(err, articles.ErrInvalidInput),
		errors.Is(err, events.ErrInvalidInput),
		errors.Is(err, committees.ErrInvalidInput),
		errors.Is(err, accesspolicies.ErrInvalidInput),
		errors.Is(err, nollning.ErrInvalidInput),
		errors.Is(err, songs.ErrInvalidInput),
		errors.Is(err, alerts.ErrInvalidInput),
		errors.Is(err, markdown.ErrInvalidInput),
		errors.Is(err, governingdocs.ErrInvalidInput),
		errors.Is(err, booking.ErrInvalidInput),
		errors.Is(err, elections.ErrInvalidInput),
		errors.Is(err, cafe.ErrInvalidInput),
		errors.Is(err, notifications.ErrInvalidInput):
		return huma.Error400BadRequest(err.Error())
	case errors.Is(err, auth.ErrUnauthenticated):
		return huma.Error401Unauthorized("unauthenticated")
	case errors.Is(err, auth.ErrForbidden):
		return huma.Error403Forbidden("forbidden")
	default:
		log.Printf("api: internal error: %v", err)
		return huma.Error500InternalServerError("internal error")
	}
}
