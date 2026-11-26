import { api } from "$lib/api/client";
import { goError } from "$lib/utils/access";
import * as m from "$paraglide/messages";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/albums/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) goError(res.response, res.error, m.gallery_album_not_found());
  return { album: res.data };
};
