<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import { Marked } from "marked";
  import type { Tokens } from "marked";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import YoutubeThumbnail from "./YoutubeThumbnail.svelte";
  import { getYoutubeVideoId } from "$lib/utils/youtube";
  import Play from "@lucide/svelte/icons/play";

  let {
    article,
    index,
  }: {
    article: Pick<
      Article,
      | "author"
      | "slug"
      | "imageUrl"
      | "header"
      | "body"
      | "createdAt"
      | "committee"
      | "youtubeUrl"
    >;
    index: number;
  } = $props();

  const videoId = $derived(getYoutubeVideoId(article.youtubeUrl));
  const articleUrl = $derived(`/news/${article.slug}`);
  let failedImageUrl = $state<string | null>(null);
  let unavailableVideoId = $state<string | null>(null);

  const videoUnavailable = $derived(
    !!videoId && unavailableVideoId === videoId,
  );
  const coverImageVisible = $derived(
    (!videoId || videoUnavailable) &&
      !!article.imageUrl &&
      failedImageUrl !== article.imageUrl,
  );

  const renderer = {
    // this removes links in the article preview, preventing svelte hydration issues
    link({ tokens }: { tokens: Tokens.Link }): string {
      // @ts-expect-error using marked types from documentation
      const text: string = this.parser.parseInline(tokens);

      return `
            <span>${text}</span>`;
    },
    heading({ tokens }: { tokens: Tokens.Heading }): string {
      //remove headings from preview
      // @ts-expect-error using marked types from documentation
      const text: string = this.parser.parseInline(tokens);

      return `
            <span>${text}</span>`;
    },
  };

  const previewMarked = new Marked();

  // @ts-expect-error using marked types from documentation
  previewMarked.use({ renderer });
</script>

<div
  class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex flex-col rounded-xl border-[1px] p-4 duration-300"
  style="animation-delay:{index * 50}ms"
>
  <a href={articleUrl} class="group block">
    <!-- The placeholder stays underneath: a broken image paints nothing,
         and this also covers failures before hydration. -->
    <div
      class="bg-muted-background relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md"
    >
      <div class="absolute inset-0" aria-hidden="true">
        <CommitteePlaceholder
          committee={article.committee}
          class="absolute inset-0"
        />
      </div>
      {#if coverImageVisible}
        {@const url = article.imageUrl}
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
      {#if videoId}
        {#key videoId}
          <YoutubeThumbnail
            {videoId}
            class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onunavailable={() => (unavailableVideoId = videoId)}
          />
        {/key}
        <span
          class="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10"
          aria-hidden="true"
        >
          <span
            class="flex size-14 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm"
          >
            <Play class="ml-1 size-6 fill-current" />
          </span>
        </span>
      {/if}
    </div>
    <h3 class="mt-2 px-2">
      {article.header}
    </h3>
    <div class="prose-p:text-foreground line-clamp-2 px-2 overflow-ellipsis">
      <!-- eslint-disable-next-line svelte/no-at-html-tags this should already be sanitized -->
      {@html previewMarked.parse(article.body)}
    </div>
  </a>
  <div class="mt-auto flex flex-row items-center justify-between pt-2">
    <AuthorCard
      member={article.author.member}
      customAuthor={article.author.customAuthor}
      position={article.author.mandate?.position}
    />
    <span class="text-muted-foreground"
      >{dayjs(article.createdAt).format("YYYY-MM-DD")}</span
    >
  </div>
</div>
