import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import { error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const DCOMPASSEN_FILE = "Dcompassen2026.html";

// Serves the file from Go (signed-in members only) with headers that keep
// its scripts sandboxed.
export const GET: RequestHandler = async ({ locals, cookies, fetch }) => {
  // Endpoint errors don't render +error.svelte, so let /dcompassen show the 401
  if (!locals.user?.memberId) {
    redirect(302, "/dcompassen");
  }

  const res = await fetch(
    new URL(`/files/${DCOMPASSEN_FILE}`, PUBLIC_GO_BACKEND_URL),
    {
      headers: {
        cookie: cookies
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join("; "),
      },
    },
  );
  if (res.status === 404) error(404, "Not Found");
  if (!res.ok) error(res.status, await res.text());

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Only behind login, so keep it out of shared caches
      "Cache-Control": "private, max-age=3600",
      // The HTML comes from a file bucket, so give it an opaque origin to keep
      // its scripts from acting as the signed-in user on our domain
      "Content-Security-Policy": "sandbox allow-scripts",
    },
  });
};
