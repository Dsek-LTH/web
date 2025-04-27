<script lang="ts">
  import { page } from "$app/state";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import type { Song } from "@prisma/client";
  import { twMerge } from "tailwind-merge";
  interface Props {
    song: Song;
    class?: string;
  }

  let { song, class: clazz = "" }: Props = $props();
</script>

<article
  class={twMerge(
    "my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 md:ring-1",
    clazz,
  )}
>
  {#if isAuthorized(apiNames.SONG.DELETE, page.data.user) && song.deletedAt != null}
    <p class="text-xl font-bold text-red-500">{m.songbook_deleted()}</p>
    <p class="text-sm text-red-300">
      {m.songbook_deletedExplanation()}
    </p>
  {/if}

  <div class="flex justify-between">
    <h2 class="my-3 text-2xl font-bold">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
      {@html song.title}
    </h2>

    <p class="text-right text-xs text-gray-500">
      {song.createdAt?.toLocaleDateString([languageTag()]) ?? ""} <br />
      {song.createdAt?.toLocaleTimeString([languageTag()], {
        hour: "2-digit",
        minute: "2-digit",
      }) ?? ""}
    </p>
  </div>

  <h3 class="mb-4 text-lg italic text-gray-500">
    {#if song.category}
      {song.category}
    {:else}
      <i>{m.songbook_missingCategory()}</i>
    {/if}
  </h3>

  <p class="mb-4 italic">{m.songbook_melody()}: {song.melody}</p>
  <p class="whitespace-pre-line">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
    {@html song.lyrics}
  </p>
</article>
