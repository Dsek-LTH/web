<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import YoutubeThumbnail from "./YoutubeThumbnail.svelte";
  import { getYoutubeVideoId } from "$lib/utils/youtube";

  let {
    article,
    isPreview,
  }: {
    article: Pick<
      Article,
      | "slug"
      | "imageUrl"
      | "header"
      | "publishedAt"
      | "committee"
      | "youtubeUrl"
    >;
    isPreview: boolean;
  } = $props();

  let failedImageUrl = $state<string | null>(null);
  let loadedImageUrl = $state<string | null>(null);
  let failedVideoId = $state<string | null>(null);
  let loadedVideoId = $state<string | null>(null);
  const videoId = $derived(getYoutubeVideoId(article.youtubeUrl));
  const imageVisible = $derived(
    !!article.imageUrl && failedImageUrl !== article.imageUrl,
  );
  const imageReady = $derived(
    imageVisible && loadedImageUrl === article.imageUrl,
  );
  const videoVisible = $derived(!!videoId && failedVideoId !== videoId);
  const videoReady = $derived(videoVisible && loadedVideoId === videoId);
  const coverReady = $derived(imageReady || videoReady);
</script>

<svelte:element
  this={isPreview ? "div" : "a"}
  href={isPreview ? undefined : `/news/${article.slug}`}
  class={[
    "bg-muted-background relative aspect-2/1 w-full overflow-hidden rounded-xl border-[1px] transition-all hover:opacity-85",
    !isPreview && "lg:w-1/3",
  ]}
>
  <div class="absolute inset-0" aria-hidden="true">
    <CommitteePlaceholder
      committee={article.committee ?? null}
      class="absolute inset-0"
    />
  </div>
  {#if article.imageUrl && imageVisible}
    {@const url = article.imageUrl}
    {#key url}
      <img
        src={url}
        alt=""
        loading="lazy"
        class="absolute inset-0 size-full object-cover transition-opacity duration-300"
        class:opacity-0={!imageReady}
        onload={(event) => {
          const src = (event.currentTarget as HTMLImageElement).getAttribute(
            "src",
          );
          if (src === article.imageUrl) loadedImageUrl = src;
        }}
        onerror={(event) =>
          (failedImageUrl = (
            event.currentTarget as HTMLImageElement
          ).getAttribute("src"))}
      />
    {/key}
  {/if}
  {#if videoId && videoVisible}
    {@const id = videoId}
    {#key id}
      <YoutubeThumbnail
        videoId={id}
        class="absolute inset-0 size-full object-cover"
        onready={() => (loadedVideoId = id)}
        onunavailable={() => (failedVideoId = id)}
      />
    {/key}
  {/if}
  {#if coverReady}
    <div class="absolute top-2 right-2 size-14 p-3">
      <CommitteeSymbol committee={article.committee ?? undefined} class="h-8" />
    </div>
    <div
      class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/60 to-transparent"
    ></div>
  {/if}
  <div
    class={[
      "relative flex h-full w-full flex-col justify-end p-4",
      coverReady && "text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]",
    ]}
  >
    <h2
      class="line-clamp-2 overflow-hidden text-3xl leading-6 lg:text-xl 2xl:text-3xl 2xl:leading-8"
    >
      {article.header}
    </h2>
    <span class="text-right font-light">
      {dayjs(article.publishedAt).format("YYYY-MM-DD")}
    </span>
  </div>
</svelte:element>
