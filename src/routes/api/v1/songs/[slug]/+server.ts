import { endpoint } from "$lib/server/api/endpoint";
import * as songs from "$lib/server/songs/service";
import { SongDto, SongSlugInput, UpdateSongInput } from "$lib/server/songs/dto";

export const GET = endpoint({
  operationId: "get-song",
  summary: "Get a song by slug",
  input: SongSlugInput,
  output: SongDto,
  handle: ({ slug }, event) => songs.get(event.locals, slug),
});

export const PUT = endpoint({
  operationId: "update-song",
  summary: "Update a song",
  input: SongSlugInput.extend(UpdateSongInput.shape),
  output: SongDto,
  handle: (input, event) => songs.update(event.locals, input),
});
