<script lang="ts">
  import { countVisibleComments } from "$lib/components/comments/threads";
  import * as m from "$paraglide/messages";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import YoutubeThumbnail from "$lib/components/YoutubeThumbnail.svelte";
  import TagRow from "$lib/components/TagRow.svelte";
  import AuthorAvatar from "$lib/components/AuthorAvatar.svelte";
  import type { ArticleCardData, ArticleTagSummary } from "$lib/news/types";
  import { getYoutubeVideoId } from "$lib/utils/youtube";
  import {
    formatPublishedFull,
    formatPublishedShort,
    getAuthorName,
  } from "$lib/news/format";
  import { SvelteSet } from "svelte/reactivity";
  import { toExcerpt } from "$lib/news/excerpt";
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";

  type ListArticle = ArticleCardData & {
    publishedAt: Date | null;
    tags: ArticleTagSummary[];
    likers: unknown[];
    comments: Array<{ content: string | null }>;
  };

  let { articles }: { articles: ListArticle[] } = $props();

  // Image URLs that failed to load; the committee placeholder underneath shows instead.
  const failedImages = new SvelteSet<string>();
</script>

<!-- A list rather than a <table>: each row is one target (stretched title link),
     which a table can't do without invalid nested links. -->
<ul class="ml-0 list-none divide-y [&>li]:my-0">
  {#each articles as article, index (article.slug)}
    {@const videoId = getYoutubeVideoId(article.youtubeUrl)}
    {@const href = `/news/${article.slug}`}
    {@const excerpt = toExcerpt(article.body)}
    {@const commentCount = countVisibleComments(article.comments)}
    {@const date = article.publishedAt ?? article.createdAt}
    <!-- Same staggered entrance as the cards in the grid view. -->
    <li
      class="group animate-in fade-in fill-mode-backwards slide-in-from-bottom-[1rem] relative flex gap-4 py-3 duration-300"
      style="animation-delay:{index * 50}ms"
    >
      <div
        class="bg-muted-background relative aspect-[3/2] w-20 shrink-0 self-center overflow-hidden rounded-md sm:w-24"
        aria-hidden="true"
      >
        <CommitteePlaceholder
          committee={article.committee}
          class="absolute inset-0"
        />
        {#if article.imageUrl && !failedImages.has(article.imageUrl)}
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover"
            onerror={() =>
              article.imageUrl && failedImages.add(article.imageUrl)}
          />
        {:else if videoId}
          <YoutubeThumbnail
            {videoId}
            class="absolute inset-0 size-full object-cover"
          />
        {/if}
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="flex items-baseline gap-3">
          <!-- The ::after overlay makes the whole row clickable. -->
          <a
            {href}
            class="focus-visible:after:ring-ring line-clamp-2 min-w-0 flex-1 font-medium break-words group-hover:underline after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:ring-2 sm:line-clamp-1"
          >
            {article.header}
          </a>
          <time
            datetime={date.toISOString()}
            title={formatPublishedFull(date)}
            class="text-muted-foreground shrink-0 text-sm whitespace-nowrap"
          >
            {formatPublishedShort(date)}
          </time>
        </div>

        {#if excerpt}
          <p class="text-muted-foreground hidden text-sm sm:line-clamp-1">
            {excerpt}
          </p>
        {/if}

        <div
          class="text-muted-foreground border-border/60 mt-1 flex min-w-0 items-center gap-x-2 border-t pt-1.5 text-xs"
        >
          <AuthorAvatar author={article.author} class="size-5" />
          <span class="truncate">
            {getAuthorName(article.author)}
            {#if article.committee}
              <span aria-hidden="true">·</span>
              <span class="text-foreground/80 font-medium"
                >{article.committee.name}</span
              >
            {/if}
          </span>
          {#if article.likers.length > 0}
            <span class="flex shrink-0 items-center gap-0.5">
              <Heart class="size-3" aria-hidden="true" />
              {article.likers.length}
              <span class="sr-only">{m.news_likes()}</span>
            </span>
          {/if}
          {#if commentCount > 0}
            <span class="flex shrink-0 items-center gap-0.5">
              <MessageCircle class="size-3" aria-hidden="true" />
              {commentCount}
              <span class="sr-only">{m.comments_title()}</span>
            </span>
          {/if}
          <!-- Takes whatever width the byline and counts leave, and fills it with tags. -->
          <TagRow tags={article.tags} class="flex-1 justify-end" />
        </div>
      </div>
    </li>
  {/each}
</ul>
