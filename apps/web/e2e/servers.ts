// Where playwright.config.ts starts the servers the tests run against: the
// API on its own database (api.sh) and a production build of the web
// app. Neither port is a dev server's, so both run beside them.
//
// The API is on a different host than the web app, as in a deployment
// (api.dsek.se and www.dsek.se): on the same host SvelteKit's fetch would
// pass the browser's cookies to the API by itself, and a server-side call
// that forgets them would go unnoticed.
export const API_URL = "http://127.0.0.1:8091";
export const WEB_URL = "http://localhost:4173";

// The API runs with AUTH_MOCK_REQUIRE_COOKIE (api.sh): a request with this
// cookie is the mock member, one without is anonymous. The browser has it
// for both hosts; a call from the web server to the API has it only if the
// web app forwarded the browser's cookies.
export const SESSION_COOKIE = "dsek_session=e2e";
