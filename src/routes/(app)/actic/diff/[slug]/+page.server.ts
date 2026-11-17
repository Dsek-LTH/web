import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  loadGoverningSource,
  resolveGoverningDocument,
} from "$lib/server/styrdokument";

export const load: PageServerLoad = async ({ params }) => {
  const resolved = await resolveGoverningDocument(params.slug);
  if (resolved.status === "unknown") error(404, "Document not found");
  if (resolved.status === "unavailable") {
    return {
      slug: params.slug,
      document: null,
      ref: null,
      commit: null,
      source: null,
      assets: [],
      error: "upstream" as const,
      assetWarning: false,
    };
  }
  try {
    const loaded = await loadGoverningSource(resolved.document);
    return {
      slug: params.slug,
      document: resolved.document,
      ...loaded,
      error: null,
    };
  } catch {
    return {
      slug: params.slug,
      document: resolved.document,
      ref: null,
      commit: null,
      source: null,
      assets: [],
      error: "upstream" as const,
      assetWarning: false,
    };
  }
};
