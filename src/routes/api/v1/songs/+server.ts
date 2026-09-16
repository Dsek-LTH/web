import { endpoint } from "$lib/server/api/endpoint";
import * as songs from "$lib/server/songs/service";
import {
  CreateSongInput,
  ListSongsInput,
  ListSongsOutput,
  SongDto,
} from "$lib/server/songs/dto";

export const GET = endpoint({
  operationId: "list-songs",
  summary: "List songs",
  input: ListSongsInput,
  output: ListSongsOutput,
  handle: (input, event) => songs.list(event.locals, input),
});

export const POST = endpoint({
  operationId: "create-song",
  summary: "Create a song",
  status: 201,
  input: CreateSongInput,
  output: SongDto,
  handle: (input, event) => songs.create(event.locals, input),
});
