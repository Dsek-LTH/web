<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import type { Song } from "@prisma/client";

  export let song: Song;
  export let accessPolicies: string[];
</script>

<article class="my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 md:ring-1">
  {#if accessPolicies.includes(apiNames.SONG.DELETE) && song.deletedAt != null}
    <p class="text-xl font-bold text-red-500">Borttagen</p>
    <p class="text-sm text-red-300">
      Men du har access att se och återställa den
    </p>
  {/if}

  <div class="flex justify-between">
    <h2 class="my-3 text-2xl font-bold">
      <!-- Sanitized server side -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html song.title ?? ""}
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
    <!-- Sanitized server side -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html song.lyrics}
  </p>
</article>
