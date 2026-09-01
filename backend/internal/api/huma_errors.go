package api

import (
	"errors"
	"log"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
)

// humaServiceError maps an internal/articles or internal/auth error to a
// huma.StatusError, mirroring writeServiceError (json.go) for the
// stdlib-handled routes during the huma migration - see
// ../../DESIGN.md's "Migration sequencing" note. Once every route is on
// huma, writeServiceError/json.go can be deleted.
func humaServiceError(err error) error {
	switch {
	case errors.Is(err, articles.ErrNotFound):
		return huma.Error404NotFound("not found")
	case errors.Is(err, articles.ErrInvalidInput):
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
