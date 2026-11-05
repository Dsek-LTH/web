// Where playwright.config.ts starts the servers the tests run against: the
// API on its own database (api.sh) and a production build of the web
// app. Neither port is a dev server's, so both run beside them.
export const API_URL = "http://localhost:8091";
export const WEB_URL = "http://localhost:4173";
