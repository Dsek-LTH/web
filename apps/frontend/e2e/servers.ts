// Where playwright.config.ts starts the servers the tests run against: a
// backend on its own database (backend.sh) and a production build of the
// frontend. Neither port is a dev server's, so both run beside them.
export const BACKEND_URL = "http://localhost:8091";
export const FRONTEND_URL = "http://localhost:4173";
