import { z } from "zod";
import { endpoint } from "$lib/server/api/endpoint";
import * as songs from "$lib/server/songs/service";
import { CategoriesOutput } from "$lib/server/songs/dto";

export const GET = endpoint({
  operationId: "list-song-categories",
  summary: "List distinct song categories",
  input: z.object({ showDeleted: z.coerce.boolean().optional() }),
  output: CategoriesOutput,
  handle: ({ showDeleted }, event) => songs.categories(event.locals, showDeleted),
});
