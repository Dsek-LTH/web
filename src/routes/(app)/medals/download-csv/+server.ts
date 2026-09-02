import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

// A thin proxy to Go's GET /medals/download-csv (a plain non-huma endpoint,
// see backend/internal/api/huma_medals.go's MedalsCSVHandler - CSV doesn't
// fit the typed JSON client, so this forwards the request/response
// directly rather than going through $lib/api/client). No page renders a
// download link yet (the /medals route is still a stub), but the endpoint
// itself is real, matching the "port server logic even without a
// page.svelte" precedent used elsewhere in this port (see DESIGN.md's
// Principle #6).
export const GET = async ({ url, request, fetch }) => {
  const target = new URL("/medals/download-csv", PUBLIC_GO_BACKEND_URL);
  target.search = url.search;

  return fetch(target, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
};
