package auth

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/db"
)

// RealAuthenticator resolves an Identity from the session cookie set by
// OIDCClient.CallbackHandler - see DESIGN.md's Auth section. A missing or
// invalid session resolves to an anonymous Identity rather than an error;
// an expired one is silently refreshed (see OIDCClient.Refresh) and the
// cookie is re-issued on w before this returns.
type RealAuthenticator struct {
	sessionCodec *SessionCodec
	oidcClient   *OIDCClient
	queries      *db.Queries
}

func NewRealAuthenticator(
	sessionCodec *SessionCodec,
	oidcClient *OIDCClient,
	queries *db.Queries,
) *RealAuthenticator {
	return &RealAuthenticator{sessionCodec: sessionCodec, oidcClient: oidcClient, queries: queries}
}

func (a *RealAuthenticator) Authenticate(
	w http.ResponseWriter,
	r *http.Request,
) (*Identity, error) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil {
		return a.anonymousIdentity(r.Context())
	}

	session, err := a.sessionCodec.Decode(cookie.Value)
	if err != nil {
		log.Printf("auth: invalid session cookie, treating as anonymous: %v", err)
		ClearSessionCookie(w)
		return a.anonymousIdentity(r.Context())
	}

	if !session.ExpiresAt.After(time.Now()) {
		refreshed, err := a.oidcClient.Refresh(r.Context(), session)
		if err != nil {
			log.Printf("auth: session refresh failed, treating as anonymous: %v", err)
			ClearSessionCookie(w)
			return a.anonymousIdentity(r.Context())
		}
		session = refreshed
		if err := SetSessionCookie(w, a.sessionCodec, session); err != nil {
			log.Printf("auth: failed to re-issue session cookie after refresh: %v", err)
		}
	}

	return a.resolveIdentity(r.Context(), session)
}

func (a *RealAuthenticator) anonymousIdentity(ctx context.Context) (*Identity, error) {
	roles := DerivedRoles(nil, false, nil, nil)
	policies, err := a.queries.ListPoliciesForRolesOrStudentID(
		ctx,
		db.ListPoliciesForRolesOrStudentIDParams{
			Roles:     roles,
			StudentID: pgtype.Text{Valid: false},
		},
	)
	if err != nil {
		return nil, err
	}
	return &Identity{Policies: policies, Roles: roles}, nil
}

func (a *RealAuthenticator) resolveIdentity(
	ctx context.Context,
	session SessionData,
) (*Identity, error) {
	member, err := a.queries.GetMemberByStudentID(
		ctx,
		pgtype.Text{String: session.StudentID, Valid: true},
	)
	if err != nil {
		return nil, err
	}

	var classYear *int
	if member.ClassYear.Valid {
		y := int(member.ClassYear.Int32)
		classYear = &y
	}
	var classProgramme *string
	if member.ClassProgramme.Valid {
		classProgramme = &member.ClassProgramme.String
	}

	roles := DerivedRoles(session.GroupList, true, classYear, classProgramme)
	policies, err := a.queries.ListPoliciesForRolesOrStudentID(
		ctx,
		db.ListPoliciesForRolesOrStudentIDParams{
			Roles:     roles,
			StudentID: pgtype.Text{String: session.StudentID, Valid: true},
		},
	)
	if err != nil {
		return nil, err
	}

	return &Identity{
		MemberID:  uuid.UUID(member.ID.Bytes).String(),
		StudentID: session.StudentID,
		Policies:  policies,
		Roles:     roles,
	}, nil
}
