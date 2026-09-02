package auth

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/db"
)

// meResponse is what hooks.server.ts's databaseHandle reads instead of
// doing its own OIDC + role/policy derivation - see DESIGN.md's Auth
// section. Identity (from context) already carries Policies; the rest here
// is profile data Identity doesn't carry, needed for the onboarding
// redirect (classYear/classProgramme) and display (givenName/familyName).
type meResponse struct {
	StudentID      string   `json:"studentId"`
	MemberID       string   `json:"memberId"`
	Policies       []string `json:"policies"`
	Roles          []string `json:"roles"`
	GivenName      string   `json:"givenName"`
	FamilyName     string   `json:"familyName"`
	Email          string   `json:"email"`
	ClassYear      *int     `json:"classYear"`
	ClassProgramme *string  `json:"classProgramme"`
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
			member, err := queries.GetMemberByStudentID(r.Context(), pgtype.Text{
				String: identity.StudentID, Valid: true,
			})
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			resp.GivenName = member.FirstName.String
			resp.FamilyName = member.LastName.String
			resp.Email = member.Email.String
			if member.ClassYear.Valid {
				y := int(member.ClassYear.Int32)
				resp.ClassYear = &y
			}
			if member.ClassProgramme.Valid {
				resp.ClassProgramme = &member.ClassProgramme.String
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
