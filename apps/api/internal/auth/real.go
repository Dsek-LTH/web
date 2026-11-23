package auth

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/db"
)

// StabenInjector is the one piece of internal/nollning RealAuthenticator
// needs: whether/how to grant apinames.MemberSeeStaben by default, and
// which year auth.DerivedRoles' "nolla" pseudo-role should use. Declared
// here (rather than RealAuthenticator taking a *nollning.Service directly)
// so this package doesn't import internal/nollning - internal/nollning's
// own Service methods use auth.Require/auth.FromContext like every other
// domain service, and importing it back from here would create an import
// cycle. nollning.Service satisfies this interface structurally; cmd/api
// wires the concrete value in.
type StabenInjector interface {
	InjectStabenPolicy(ctx context.Context, policies []string) ([]string, error)
	NollaYear(ctx context.Context) (int, error)
}

// RealAuthenticator resolves an Identity from the session cookie set by
// OIDCClient.CallbackHandler. A missing or
// invalid session, or one for a member that no longer exists, resolves to
// an anonymous Identity (and clears the cookie) rather than an error;
// an expired one is silently refreshed (see OIDCClient.Refresh) and the
// cookie is re-issued on w before this returns.
type RealAuthenticator struct {
	sessionCodec *SessionCodec
	oidcClient   *OIDCClient
	queries      *db.Queries
	nollning     StabenInjector
}

func NewRealAuthenticator(
	sessionCodec *SessionCodec,
	oidcClient *OIDCClient,
	queries *db.Queries,
	nollning StabenInjector,
) *RealAuthenticator {
	return &RealAuthenticator{
		sessionCodec: sessionCodec,
		oidcClient:   oidcClient,
		queries:      queries,
		nollning:     nollning,
	}
}

// NewAnonymousAuthenticator resolves every request as anonymous, with the
// policies real auth gives a caller without a session.
// NewCookieGatedMockAuthenticator's fallback.
func NewAnonymousAuthenticator(queries *db.Queries, nollning StabenInjector) Authenticator {
	return anonymousAuthenticator{&RealAuthenticator{queries: queries, nollning: nollning}}
}

type anonymousAuthenticator struct{ a *RealAuthenticator }

func (a anonymousAuthenticator) Authenticate(
	_ http.ResponseWriter,
	r *http.Request,
) (*Identity, error) {
	return a.a.anonymousIdentity(r.Context())
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
		slog.Warn("auth: invalid session cookie, treating as anonymous", "err", err)
		ClearSessionCookie(w)
		return a.anonymousIdentity(r.Context())
	}

	if !session.ExpiresAt.After(time.Now()) {
		refreshed, err := a.oidcClient.Refresh(r.Context(), session)
		if err != nil {
			slog.Warn("auth: session refresh failed, treating as anonymous", "err", err)
			ClearSessionCookie(w)
			return a.anonymousIdentity(r.Context())
		}
		session = refreshed
		if err := SetSessionCookie(w, a.sessionCodec, session); err != nil {
			slog.Error("auth: re-issue session cookie after refresh", "err", err)
		}
	}

	identity, err := a.resolveIdentity(r.Context(), session)
	if errors.Is(err, pgx.ErrNoRows) {
		// The session names a member who no longer exists (removed or
		// renamed since login). Members are only created in /auth/callback,
		// so treat it as an invalid session: logging in again re-creates
		// the member.
		slog.Warn("auth: session for unknown member, treating as anonymous",
			"studentId", session.StudentID)
		ClearSessionCookie(w)
		return a.anonymousIdentity(r.Context())
	}
	return identity, err
}

func (a *RealAuthenticator) anonymousIdentity(ctx context.Context) (*Identity, error) {
	// classYear is nil for an anonymous identity, so the nolla year never
	// actually matters here - passed as 0 purely to satisfy DerivedRoles'
	// signature.
	roles := DerivedRoles(nil, false, nil, nil, 0)
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
	policies, err = a.nollning.InjectStabenPolicy(ctx, policies)
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

	nollaYear, err := a.nollning.NollaYear(ctx)
	if err != nil {
		return nil, err
	}
	roles := DerivedRoles(session.GroupList, true, classYear, classProgramme, nollaYear)
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
	policies, err = a.nollning.InjectStabenPolicy(ctx, policies)
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
