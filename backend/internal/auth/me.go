package auth

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// meResponse is what hooks.server.ts reads instead of doing its own OIDC
// + role/policy derivation - see DESIGN.md's Auth section. Member is the
// signed-in member's own profile fields the layout needs on every request
// (onboarding redirect, header, <html lang>); nil for an anonymous caller.
type meResponse struct {
	StudentID string    `json:"studentId"`
	MemberID  string    `json:"memberId"`
	Policies  []string  `json:"policies"`
	Roles     []string  `json:"roles"`
	Member    *meMember `json:"member"`
}

type meMember struct {
	ID             string  `json:"id"`
	StudentID      string  `json:"studentId"`
	FirstName      *string `json:"firstName"`
	Nickname       *string `json:"nickname"`
	LastName       *string `json:"lastName"`
	Email          *string `json:"email"`
	PicturePath    *string `json:"picturePath"`
	ClassProgramme *string `json:"classProgramme"`
	ClassYear      *int32  `json:"classYear"`
	Language       *string `json:"language"`
}

// MeHandler is a plain (non-huma) endpoint, like the other /auth/* routes -
// SvelteKit's server-side hooks.server.ts is its only intended caller.
func MeHandler(queries *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		identity, ok := FromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := meResponse{
			StudentID: identity.StudentID,
			MemberID:  identity.MemberID,
			Policies:  identity.Policies,
			Roles:     identity.Roles,
		}

		if identity.StudentID != "" {
			m, err := queries.GetMemberProfile(r.Context(), pgtype.Text{
				String: identity.StudentID, Valid: true,
			})
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			resp.Member = &meMember{
				ID:             dbutil.UUIDStr(m.ID),
				StudentID:      identity.StudentID,
				FirstName:      dbutil.TextPtr(m.FirstName),
				Nickname:       dbutil.TextPtr(m.Nickname),
				LastName:       dbutil.TextPtr(m.LastName),
				Email:          dbutil.TextPtr(m.Email),
				PicturePath:    dbutil.TextPtr(m.PicturePath),
				ClassProgramme: dbutil.TextPtr(m.ClassProgramme),
				ClassYear:      dbutil.Int4Ptr(m.ClassYear),
				Language:       dbutil.TextPtr(m.Language),
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
