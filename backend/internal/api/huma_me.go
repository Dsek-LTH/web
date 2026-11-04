package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// Me is what hooks.server.ts reads instead of doing its own OIDC +
// role/policy derivation - see DESIGN.md's Auth section.
type Me struct {
	StudentID string    `json:"studentId"        doc:"Empty for an anonymous caller."`
	MemberID  string    `json:"memberId"         doc:"Empty for an anonymous caller."`
	Policies  []string  `json:"policies"         doc:"Every API policy the caller holds, e.g. article:create."`
	Roles     []string  `json:"roles"            doc:"Every role the caller has, derived from mandates (e.g. dsek.cafe), plus * (anyone) and _ (signed in)."`
	Member    *MeMember `json:"member,omitempty" doc:"The signed-in member's own profile. Omitted for an anonymous caller."`
}

// MeMember is the part of the signed-in member's profile the layout needs
// on every request (onboarding redirect, header, <html lang>).
type MeMember struct {
	ID             string             `json:"id"`
	StudentID      string             `json:"studentId"`
	FirstName      *string            `json:"firstName,omitempty"`
	Nickname       *string            `json:"nickname,omitempty"`
	LastName       *string            `json:"lastName,omitempty"`
	Email          *string            `json:"email,omitempty"`
	PicturePath    *string            `json:"picturePath,omitempty"    doc:"Public URL of the profile picture."`
	ClassProgramme *string            `json:"classProgramme,omitempty" doc:"Unset until onboarding is done."`
	ClassYear      *int32             `json:"classYear,omitempty"      doc:"Unset until onboarding is done."`
	Language       *apitypes.Language `json:"language,omitempty"       doc:"Preferred UI language."`
}

func registerMeRoutes(api huma.API, queries *db.Queries) {
	// GET /me's URL must not change: SvelteKit's hooks.server.ts calls it
	// on every request.
	huma.Register(api, huma.Operation{
		OperationID: "get-me",
		Method:      http.MethodGet,
		Path:        "/me",
		Tags:        []string{"Me"},
		Summary:     "Get the caller's identity",
		Description: "Who the caller is, with their policies and roles. Works anonymously too: " +
			"an anonymous caller gets empty ids, the anonymous policies, and no member.",
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body Me }, error) {
		identity, ok := auth.FromContext(ctx)
		if !ok {
			return nil, huma.Error401Unauthorized("unauthenticated")
		}
		me := Me{
			StudentID: identity.StudentID,
			MemberID:  identity.MemberID,
			Policies:  identity.Policies,
			Roles:     identity.Roles,
		}
		if identity.StudentID != "" {
			m, err := queries.GetMemberProfile(
				ctx,
				pgtype.Text{String: identity.StudentID, Valid: true},
			)
			if err != nil {
				return nil, humaServiceError(err)
			}
			me.Member = &MeMember{
				ID:             dbutil.UUIDStr(m.ID),
				StudentID:      identity.StudentID,
				FirstName:      dbutil.TextPtr(m.FirstName),
				Nickname:       dbutil.TextPtr(m.Nickname),
				LastName:       dbutil.TextPtr(m.LastName),
				Email:          dbutil.TextPtr(m.Email),
				PicturePath:    dbutil.TextPtr(m.PicturePath),
				ClassProgramme: dbutil.TextPtr(m.ClassProgramme),
				ClassYear:      dbutil.Int4Ptr(m.ClassYear),
				Language:       (*apitypes.Language)(dbutil.TextPtr(m.Language)),
			}
		}
		return &struct{ Body Me }{Body: me}, nil
	})
}
