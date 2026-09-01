package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/gob"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/oauth2"

	"github.com/dsek-lth/web/backend/internal/db"
)

// AuthentikProfile is the subset of Authentik's ID token claims this
// backend reads, mirroring hooks.server.ts's Authentik `profile` mapping.
type AuthentikProfile struct {
	Sub               string   `json:"sub"`
	PreferredUsername string   `json:"preferred_username"`
	GivenName         string   `json:"given_name"`
	FamilyName        string   `json:"family_name"`
	Email             string   `json:"email"`
	Groups            []string `json:"groups"`
}

// oauthStateData is the short-lived cookie carrying PKCE state across the
// redirect to Authentik and back - separate from SessionData/
// SessionCookieName, and never shared with SvelteKit (login/callback both
// happen on this API's own origin).
type oauthStateData struct {
	State        string
	CodeVerifier string
	ReturnTo     string
}

const oauthStateCookieName = "dsek_oauth_state"

func init() {
	gob.Register(oauthStateData{})
}

// OIDCClient owns the OAuth2/OIDC handshake with Authentik: login,
// callback, logout. It replaces @auth/sveltekit's SvelteKitAuth setup in
// hooks.server.ts (see DESIGN.md's Auth section) - Go is now the OIDC
// client and session authority, not SvelteKit.
type OIDCClient struct {
	oauth2Config  oauth2.Config
	verifier      *oidc.IDTokenVerifier
	sessionCodec  *SessionCodec
	queries       *db.Queries
	endSessionURL string
	frontendURL   string
}

// NewOIDCClient discovers the issuer's endpoints/JWKS via OIDC discovery.
// clientSecret is empty for the dev Authentik provider (registered as a
// public PKCE client - see .env's AUTH_AUTHENTIK_CLIENT_SECRET comment),
// which Authentik signs ID tokens for with RS256, verified via its JWKS the
// normal way. A real deployment's provider is confidential (has a secret)
// and Authentik signs those with HS256 instead - verified here via
// hmacKeySet using that same secret as the HMAC key, since go-oidc's JWKS
// verifier can't check a symmetric signature at all. Either way the token
// is genuinely cryptographically verified - never skipped.
func NewOIDCClient(
	ctx context.Context,
	issuer, clientID, clientSecret, callbackURL, endSessionURL, frontendURL string,
	sessionCodec *SessionCodec,
	queries *db.Queries,
) (*OIDCClient, error) {
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, err
	}

	verifierConfig := &oidc.Config{ClientID: clientID}
	var verifier *oidc.IDTokenVerifier
	if clientSecret != "" {
		verifierConfig.SupportedSigningAlgs = []string{"HS256"}
		verifier = oidc.NewVerifier(
			issuer,
			hmacKeySet{secret: []byte(clientSecret)},
			verifierConfig,
		)
	} else {
		verifier = provider.Verifier(verifierConfig)
	}

	return &OIDCClient{
		oauth2Config: oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			Endpoint:     provider.Endpoint(),
			RedirectURL:  callbackURL,
			// Matches hooks.server.ts's authorization.params.scope exactly,
			// including Authentik's custom "splitname" scope (splits the
			// profile name into given_name/family_name claims).
			Scopes: []string{"openid", "profile", "email", "offline_access", "splitname"},
		},
		verifier:      verifier,
		sessionCodec:  sessionCodec,
		queries:       queries,
		endSessionURL: endSessionURL,
		frontendURL:   frontendURL,
	}, nil
}

// LoginHandler redirects to Authentik's authorize endpoint, stashing PKCE
// state in a short-lived cookie (10 minutes - plenty for a login redirect
// round trip) scoped to this API's own origin only.
func (c *OIDCClient) LoginHandler(w http.ResponseWriter, r *http.Request) {
	returnTo := r.URL.Query().Get("returnTo")
	if returnTo == "" {
		returnTo = "/"
	}
	state, err := randomToken()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	verifier := oauth2.GenerateVerifier()

	value, err := c.sessionCodec.encodeNamed(oauthStateCookieName, oauthStateData{
		State:        state,
		CodeVerifier: verifier,
		ReturnTo:     returnTo,
	})
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookieName,
		Value:    value,
		Path:     "/",
		MaxAge:   600,
		HttpOnly: true,
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})

	authURL := c.oauth2Config.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))
	http.Redirect(w, r, authURL, http.StatusFound)
}

// CallbackHandler exchanges the authorization code, verifies the ID token,
// resolves-or-creates the Member row, and mints the session cookie.
func (c *OIDCClient) CallbackHandler(w http.ResponseWriter, r *http.Request) {
	stateCookie, err := r.Cookie(oauthStateCookieName)
	if err != nil {
		http.Error(w, "missing oauth state", http.StatusBadRequest)
		return
	}
	// Clear the state cookie regardless of outcome - it's single-use.
	http.SetCookie(w, &http.Cookie{
		Name: oauthStateCookieName, Value: "", Path: "/", MaxAge: -1,
	})

	var stateData oauthStateData
	if err := c.sessionCodec.decodeNamed(
		oauthStateCookieName,
		stateCookie.Value,
		&stateData,
	); err != nil {
		http.Error(w, "invalid oauth state", http.StatusBadRequest)
		return
	}
	if r.URL.Query().Get("state") != stateData.State {
		http.Error(w, "state mismatch", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	token, err := c.oauth2Config.Exchange(
		r.Context(),
		code,
		oauth2.VerifierOption(stateData.CodeVerifier),
	)
	if err != nil {
		log.Printf("auth: token exchange failed: %v", err)
		http.Error(w, "token exchange failed", http.StatusBadGateway)
		return
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		http.Error(w, "missing id_token", http.StatusBadGateway)
		return
	}
	idToken, err := c.verifier.Verify(r.Context(), rawIDToken)
	if err != nil {
		log.Printf("auth: id_token verification failed: %v", err)
		http.Error(w, "id_token verification failed", http.StatusBadGateway)
		return
	}
	var profile AuthentikProfile
	if err := idToken.Claims(&profile); err != nil {
		http.Error(w, "invalid id_token claims", http.StatusBadGateway)
		return
	}

	if err := resolveOrCreateMember(r.Context(), c.queries, profile); err != nil {
		log.Printf("auth: resolve member failed: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	session := SessionData{
		StudentID:    profile.PreferredUsername,
		GroupList:    profile.Groups,
		RefreshToken: token.RefreshToken,
		ExpiresAt:    token.Expiry,
	}
	if err := SetSessionCookie(w, c.sessionCodec, session); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, c.frontendURL+stateData.ReturnTo, http.StatusFound)
}

// Refresh exchanges session's refresh token for a new access token,
// returning an updated SessionData. Unlike hooks.server.ts's jwt callback
// (which decodes the refreshed access token's JWT payload unverified to
// read updated groups), this verifies the refreshed ID token the same way
// CallbackHandler verifies the initial one - a deliberate improvement, not
// a fidelity requirement, since auth is exactly the place not to copy a
// known-hacky shortcut. If Authentik doesn't return a new id_token on
// refresh, the group list carries over unchanged.
func (c *OIDCClient) Refresh(ctx context.Context, session SessionData) (SessionData, error) {
	token, err := c.oauth2Config.TokenSource(ctx, &oauth2.Token{
		RefreshToken: session.RefreshToken,
	}).Token()
	if err != nil {
		return SessionData{}, err
	}

	updated := session
	updated.ExpiresAt = token.Expiry
	if token.RefreshToken != "" {
		updated.RefreshToken = token.RefreshToken
	}
	if rawIDToken, ok := token.Extra("id_token").(string); ok {
		if idToken, err := c.verifier.Verify(ctx, rawIDToken); err == nil {
			var profile AuthentikProfile
			if err := idToken.Claims(&profile); err == nil {
				updated.GroupList = profile.Groups
			}
		}
	}
	return updated, nil
}

// LogoutHandler clears the session cookie and redirects to Authentik's
// end-session endpoint - matches lib/utils/auth.ts's signOut() exactly,
// including not passing a post-logout redirect back to Authentik.
func (c *OIDCClient) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	ClearSessionCookie(w)
	http.Redirect(w, r, c.endSessionURL, http.StatusFound)
}

// resolveOrCreateMember mirrors src/lib/utils/member.ts's
// getOrCreate-on-login flow in hooks.server.ts's databaseHandle - see
// CreateMember's doc comment for what's deliberately not ported.
func resolveOrCreateMember(
	ctx context.Context,
	queries *db.Queries,
	profile AuthentikProfile,
) error {
	_, err := queries.GetMemberByStudentID(
		ctx,
		pgtype.Text{String: profile.PreferredUsername, Valid: true},
	)
	if err == nil {
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	_, err = queries.CreateMember(ctx, db.CreateMemberParams{
		StudentID: pgtype.Text{String: profile.PreferredUsername, Valid: true},
		FirstName: pgtype.Text{String: profile.GivenName, Valid: profile.GivenName != ""},
		LastName:  pgtype.Text{String: profile.FamilyName, Valid: profile.FamilyName != ""},
		Email:     pgtype.Text{String: profile.Email, Valid: profile.Email != ""},
		ClassYear: pgtype.Int4{Int32: int32(time.Now().Year()), Valid: true},
	})
	return err
}

func randomToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
