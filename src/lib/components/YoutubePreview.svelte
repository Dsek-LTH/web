<script lang="ts">
  import Play from "@lucide/svelte/icons/play";
  import { twMerge } from "tailwind-merge";
  import * as m from "$paraglide/messages";
  import YoutubeFrame from "./YoutubeFrame.svelte";
  import YoutubeThumbnail from "./YoutubeThumbnail.svelte";
  import CommitteePlaceholder from "./images/CommitteePlaceholder.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { getYoutubeEmbedUrl } from "$lib/utils/youtube";

  type Committee = Pick<
    ExtendedPrismaModel<"Committee">,
    "shortName" | "symbolUrl" | "name"
  >;

  let {
    videoId,
    title,
    imageUrl,
    committee,
    class: klass,
  }: {
    videoId: string;
    /** Describes the video for the play button and the embedded player. */
    title: string;
    /** Cover image used when the video thumbnail is unavailable. */
    imageUrl?: string | null;
    committee?: Committee | null;
    class?: string;
  } = $props();

  let playing = $state(false);
  let failedImageUrl = $state<string | null>(null);
  const imageVisible = $derived(!!imageUrl && failedImageUrl !== imageUrl);

  const embedUrl = $derived(getYoutubeEmbedUrl(videoId, true));
</script>

<div
  class={twMerge(
    "bg-muted-background relative overflow-hidden rounded-md",
    klass,
  )}
>
  {#if playing}
    <YoutubeFrame src={embedUrl} {title} />
  {:else}
    <button
      type="button"
      class="group relative block size-full cursor-pointer"
      aria-label={m.news_play_video({ title })}
      onclick={() => (playing = true)}
    >
      <div class="absolute inset-0" aria-hidden="true">
        <CommitteePlaceholder
          committee={committee ?? null}
          class="absolute inset-0"
        />
      </div>
      {#if imageUrl && imageVisible}
        {@const url = imageUrl}
        {#key url}
          <img
            src={url}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover opacity-0"
            onload={(event) =>
              (event.currentTarget as HTMLImageElement).classList.replace(
                "opacity-0",
                "opacity-100",
              )}
            onerror={(event) =>
              (failedImageUrl = (
                event.currentTarget as HTMLImageElement
              ).getAttribute("src"))}
          />
        {/key}
      {/if}
      {#key videoId}
        <YoutubeThumbnail
          {videoId}
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      {/key}
      <span
        class="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10"
      >
        <span
          class="flex size-14 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm"
        >
          <Play class="ml-1 size-6 fill-current" />
        </span>
      </span>
    </button>
  {/if}
</div>
