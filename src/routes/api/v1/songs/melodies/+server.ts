import { z } from "zod";
import { endpoint } from "$lib/server/api/endpoint";
import * as songs from "$lib/server/songs/service";
import { MelodiesOutput } from "$lib/server/songs/dto";

export const GET = endpoint({
  operationId: "list-song-melodies",
  summary: "List distinct song melodies",
  input: z.object({ showDeleted: z.coerce.boolean().optional() }),
  output: MelodiesOutput,
  handle: ({ showDeleted }, event) => songs.melodies(event.locals, showDeleted),
});
