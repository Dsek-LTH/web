import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

// A thin proxy to Go's GET /medals.csv (backend/internal/api/huma_medals.go;
// the typed client only handles JSON, so this forwards the request and
// response directly). No page renders a
// download link yet (the /medals route is still a stub), but the endpoint
// itself is real.
export const GET = async ({ url, request, fetch }) => {
  const target = new URL("/medals.csv", PUBLIC_GO_BACKEND_URL);
  target.search = url.search;

  return fetch(target, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
};
