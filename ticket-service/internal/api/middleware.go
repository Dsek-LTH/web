package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/Dsek-LTH/ticket-service/internal/authjwt"
)

// authKind is set on each Operation's Metadata to say which auth check the
// shared middleware below should run for it.
type authKind string

const (
	authKindKey authKind = "auth"

	// authNone: no auth required (public aggregate-counts endpoint).
	authNone = "none"
	// authMember: caller must present a valid Authentik id_token, forwarded
	// by SvelteKit server code the same way scheduler-service already
	// expects it (see scheduleExecution.ts).
	authMember = "member"
)

type identityCtxKey struct{}

// IdentityFromContext returns the authenticated member for the current
// request. Only valid on operations registered with authMember.
func IdentityFromContext(ctx context.Context) authjwt.Identity {
	identity, _ := ctx.Value(identityCtxKey{}).(authjwt.Identity)
	return identity
}

func authMiddleware(api huma.API, validator *authjwt.Validator) func(huma.Context, func(huma.Context)) {
	return func(ctx huma.Context, next func(huma.Context)) {
		kind, _ := ctx.Operation().Metadata[string(authKindKey)].(string)

		switch kind {
		case authNone:
			next(ctx)

		case authMember:
			identity, err := validator.ValidateBearer(ctx.Context(), ctx.Header("Authorization"))
			if err != nil {
				_ = huma.WriteErr(api, ctx, http.StatusUnauthorized, "unauthorized")
				return
			}
			next(huma.WithValue(ctx, identityCtxKey{}, identity))

		default:
			_ = huma.WriteErr(api, ctx, http.StatusInternalServerError, "operation missing auth metadata")
		}
	}
}

func metadataFor(kind string) map[string]any {
	return map[string]any{string(authKindKey): kind}
}
