package api

import (
	"errors"
	"log"

	"github.com/danielgtaylor/huma/v2"

	"github.com/Dsek-LTH/ticket-service/internal/releases"
)

// mapServiceError turns a releases package sentinel error into the
// corresponding huma error response. Anything unrecognized is logged and
// reported as a generic 500 so internal details never leak to callers.
func mapServiceError(err error) error {
	switch {
	case errors.Is(err, releases.ErrNotFound), errors.Is(err, releases.ErrEntryNotFound):
		return huma.Error404NotFound(err.Error())
	case errors.Is(err, releases.ErrInvalidInput):
		return huma.Error400BadRequest(err.Error())
	case errors.Is(err, releases.ErrNotOpenYet), errors.Is(err, releases.ErrOfferNotActive), errors.Is(err, releases.ErrClosed):
		return huma.Error409Conflict(err.Error())
	default:
		log.Printf("internal error: %v", err)
		return huma.Error500InternalServerError("internal error")
	}
}
