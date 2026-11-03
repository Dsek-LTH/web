import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";

// The API is the Go backend's now; this serves its OpenAPI spec at the old
// URL (interactive docs are at the backend's /docs).
export const GET: RequestHandler = ({ fetch }) =>
  fetch(new URL("/openapi.json", PUBLIC_GO_BACKEND_URL));
