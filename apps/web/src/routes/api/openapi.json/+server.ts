import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";
import { passOn } from "$lib/server/proxy";

// The API is the Go backend's now; this serves its OpenAPI spec at the old
// URL (interactive docs are at the backend's /docs).
export const GET: RequestHandler = async ({ fetch }) =>
  passOn(await fetch(new URL("/openapi.json", PUBLIC_GO_BACKEND_URL)));
