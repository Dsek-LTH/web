<script lang="ts">
  import { getLocale } from "$paraglide/runtime";
  import { NEWS_TIME_ZONE, formatPublishedFull } from "$lib/news/format";
  import ImageList from "$lib/components/ImageList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import YoutubeEmbed from "$lib/components/YoutubeEmbed.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import type { ArticleContentData } from "$lib/news/types";
  import { getYoutubeEmbedUrlFromUrl } from "$lib/utils/youtube";
  import type { Snippet } from "svelte";

  let {
    article,
    headerActions,
    byline,
    isPreview = false,
  }: {
    article: ArticleContentData;
    headerActions?: Snippet;
    /** Receives the formatted publish date, so it can sit inside the author line. */
    byline?: Snippet<[date: Snippet]>;
    isPreview?: boolean;
  } = $props();

  // Same precedence as the news cards: a video wins over the cover image.
  const hasVideo = $derived(!!getYoutubeEmbedUrlFromUrl(article.youtubeUrl));
  const coverUrl = $derived(article.imageUrl ?? article.imageUrls[0] ?? null);
  const heroUrl = $derived(hasVideo ? null : coverUrl);
  // Everything not already used as the hero goes to the gallery under the body.
  const galleryImages = $derived(
    article.imageUrls.filter((url) => url !== heroUrl),
  );
  // A cover that fails to load would otherwise leave an empty, margined box above the title.
  let failedHeroUrl = $state<string | null>(null);
  const heroImage = $derived(heroUrl === failedHeroUrl ? null : heroUrl);

  const published = $derived(
    new Date(article.publishedAt ?? article.createdAt),
  );
  const publishedLabel = $derived(
    published.toLocaleDateString(getLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: NEWS_TIME_ZONE,
    }),
  );
  const publishedFull = $derived(formatPublishedFull(published));
</script>

{#snippet date()}
  <time datetime={published.toISOString()} title={publishedFull}>
    {publishedLabel}
  </time>
{/snippet}

<!--
  Title first at every width: tags, title, byline, then the body at reading width.
  Media and gallery form one block: after the body when narrow (phones, the editor
  preview), and in a sticky column beside the body when there are 60rem+ for the
  article (laptops), using the room the line-length cap on the body leaves free.
  A container query rather than a screen breakpoint, so the narrower editor preview
  stays single-column on a laptop.
-->
<div class="@container min-w-0">
  <div
    class="flex flex-col @min-[60rem]:grid @min-[60rem]:grid-cols-[minmax(0,39rem)_minmax(0,1fr)] @min-[60rem]:gap-x-12"
  >
    <header class="flex flex-col gap-3 @min-[60rem]:col-span-2">
      {#if article.tags.length > 0}
        <div class="flex flex-row flex-wrap gap-2">
          {#each article.tags as tag (tag.id)}
            <TagChip {tag} />
          {/each}
        </div>
      {/if}

      <!-- The editor preview sits under the editor's own headings, so it must not claim the page's h1. -->
      <svelte:element
        this={isPreview ? "h3" : "h1"}
        class="font-sans text-3xl leading-tight font-bold tracking-tight break-words sm:text-4xl"
      >
        {article.header}
      </svelte:element>

      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 text-sm">
          {#if byline}
            {@render byline(date)}
          {:else}
            <span class="text-muted-foreground">{@render date()}</span>
          {/if}
        </div>
        {#if headerActions}
          <div class="shrink-0">
            {@render headerActions()}
          </div>
        {/if}
      </div>
    </header>

    <MarkdownBody
      class="article-body text-foreground mt-4 min-w-0 overflow-x-auto text-base leading-7 break-words @min-[60rem]:col-start-1 @min-[60rem]:row-start-2 @min-[60rem]:mt-6"
      body={article.body}
      preview={isPreview}
    />

    {#if hasVideo || heroImage || galleryImages.length > 0}
      <aside
        class="mt-6 flex flex-col gap-4 @min-[60rem]:sticky @min-[60rem]:top-24 @min-[60rem]:col-start-2 @min-[60rem]:row-start-2 @min-[60rem]:self-start"
      >
        {#if hasVideo}
          <YoutubeEmbed url={article.youtubeUrl} title={article.header} />
        {:else if heroImage}
          <Dialog.Root>
            <Dialog.Trigger
              class="bg-muted-background focus-visible:ring-ring block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <!-- object-contain with a height cap: posters are often portrait and must not be cropped here. -->
              <img
                src={heroImage}
                alt=""
                class="mx-auto max-h-[32rem] w-auto object-contain"
                onerror={() => (failedHeroUrl = heroImage)}
              />
            </Dialog.Trigger>
            <Dialog.Content class="p-2 sm:max-w-3xl">
              <Dialog.Title class="sr-only">{article.header}</Dialog.Title>
              <img
                src={heroImage}
                alt=""
                class="max-h-[80vh] w-full rounded-md object-contain"
              />
            </Dialog.Content>
          </Dialog.Root>
        {/if}

        <ImageList images={galleryImages} class="@min-[60rem]:grid-cols-2" />
      </aside>
    {/if}
  </div>
</div>
