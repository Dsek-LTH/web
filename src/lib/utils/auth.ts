import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

// Login/logout are now full-page redirects to the Go backend's own
// /auth/login and /auth/logout (backend/internal/auth) - it owns the OIDC
// session, not @auth/sveltekit anymore. See backend/DESIGN.md's Auth
// section.
export function signIn() {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.href = `${PUBLIC_GO_BACKEND_URL}/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function signOut() {
  window.location.href = `${PUBLIC_GO_BACKEND_URL}/auth/logout`;
}
