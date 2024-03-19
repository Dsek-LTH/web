<script lang="ts">
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { Song } from "@prisma/client";
  import DOMPurify from "isomorphic-dompurify";
  import { twMerge } from "tailwind-merge";

  export let song: Song;
  let clazz = "";
  export { clazz as class };
</script>

<article
  class={twMerge(
    "my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 md:ring-1",
    clazz,
  )}
>
  {#if isAuthorized(apiNames.SONG.DELETE, $page.data.user) && song.deletedAt != null}
    <p class="text-xl font-bold text-red-500">Borttagen</p>
    <p class="text-sm text-red-300">
      Du har åtkomst till att se sången och återställa den
    </p>
  {/if}

  <div class="flex justify-between">
    <h2 class="my-3 text-2xl font-bold">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
      {@html DOMPurify.sanitize(song.title)}
    </h2>

    <p class="text-right text-xs text-gray-500">
      {song.createdAt?.toLocaleDateString(["sv"]) ?? ""} <br />
      {song.createdAt?.toLocaleTimeString(["sv"], {
        hour: "2-digit",
        minute: "2-digit",
      }) ?? ""}
    </p>
  </div>

  <h3 class="mb-4 text-lg italic text-gray-500">
    {#if song.category}
      {song.category}
    {:else}
      <i>Kategori saknas</i>
    {/if}
  </h3>

  <p class="mb-4 italic">Mel: {song.melody}</p>
  <p class="whitespace-pre-line">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
    {@html DOMPurify.sanitize(song.lyrics)}
  </p>
</article>
