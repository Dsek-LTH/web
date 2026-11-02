import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import minio from "$lib/files/minio";
import { error, redirect } from "@sveltejs/kit";
import { S3Error } from "minio";
import { buffer } from "node:stream/consumers";
import type { RequestHandler } from "./$types";

const DCOMPASSEN_PATH = "public/miscellaneous/Dcompassen2026.html";

export const GET: RequestHandler = async ({ locals }) => {
  // Endpoint errors don't render +error.svelte, so let /dcompassen show the 401
  if (!locals.user?.memberId) {
    redirect(302, "/dcompassen");
  }

  let html: Buffer;
  try {
    html = await buffer(
      await minio.getObject(PUBLIC_BUCKETS_FILES, DCOMPASSEN_PATH),
    );
  } catch (e) {
    if (e instanceof S3Error && e.code === "NoSuchKey") {
      error(404, "Not Found");
    }
    throw e;
  }

  return new Response(html, {
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
