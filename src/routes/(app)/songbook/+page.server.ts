import * as songs from "$lib/server/songs/service";
import type { PageServerLoad } from "./$types";
import { canAccessDeletedSongs, groupCategories } from "./helpers";

export const load: PageServerLoad = async ({ locals, url }) => {
  const accessPolicies = locals.user?.policies ?? [];
  const showDeleted =
    canAccessDeletedSongs(accessPolicies) &&
    url.searchParams.get("show-deleted") === "true";

  const search = url.searchParams.get("search") || "";
  const categoryFilter = url.searchParams.getAll("category");
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const [{ songs: songList, pageCount }, rawCategories] = await Promise.all([
    songs.list(locals, { search, category: categoryFilter, page, showDeleted }),
    songs.categories(locals, showDeleted),
  ]);

  const categoryMap = groupCategories(rawCategories);

  return {
    songs: songList,
    pageCount,
    categories: Object.keys(categoryMap),
    categoryMap,
    currentPage: page,
    search,
    categoryFilter,
    showDeleted,
  };
};
