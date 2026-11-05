import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// Ported from +page.server.ts to a universal load calling the Go backend
// (apps/api/internal/gallery.Service.GetAlbum). album.json metadata parsing now happens server-side in
// Go instead of an HTTP round-trip through the object's own public URL.
export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/albums/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) throw error(404, "Album not found");

  return {
    album: params.slug,
    pictures: res.data.pictures ?? [],
    metadata:
      res.data.photographer || res.data.editor
        ? {
            photographer: res.data.photographer ?? "",
            editor: res.data.editor ?? "",
          }
        : undefined,
  };
};
