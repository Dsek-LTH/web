<script lang="ts">
  import type { ArticleCardData, ArticleTagSummary } from "$lib/news/types";
  import AuthorCard from "./AuthorCard.svelte";
  import AuthorAvatar from "./AuthorAvatar.svelte";
  import TagRow from "./TagRow.svelte";
  import { toExcerpt } from "$lib/news/excerpt";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import YoutubeThumbnail from "./YoutubeThumbnail.svelte";
  import { getYoutubeVideoId } from "$lib/utils/youtube";
  import { getAuthorName, NEWS_TIME_ZONE } from "$lib/news/format";
  import { getLocale } from "$paraglide/runtime";
  import * as m from "$paraglide/messages";
  import Heart from "@lucide/svelte/icons/heart";
  import MessageCircle from "@lucide/svelte/icons/message-circle";

  let {
    article,
    index,
    isPreview = false,
    variant = "default",
    tags = [],
    href,
  }: {
    article: ArticleCardData;
    index: number;
    isPreview?: boolean;
    /** Where the card links; defaults to the article page. */
    href?: string;
    /**
     * `default`: bordered card with author avatar (home, TV, profiles).
     * `editorial`: borderless, image-led card with a single meta line, for dense grids like /news.
     */
    variant?: "default" | "editorial";
    /** Shown in the `editorial` variant only. */
    tags?: ArticleTagSummary[];
  } = $props();

  const videoId = $derived(getYoutubeVideoId(article.youtubeUrl));
  const articleUrl = $derived(href ?? `/news/${article.slug}`);
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

  const authorName = $derived(getAuthorName(article.author));

  const excerptText = $derived(toExcerpt(article.body));
  const date = $derived(new Date(article.publishedAt ?? article.createdAt));
  // In the fixed news time zone, so server and client agree on the day around midnight.
  const shortDate = $derived(
    date.toLocaleDateString(getLocale(), {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: NEWS_TIME_ZONE,
    }),
  );
  // sv-SE formats as YYYY-MM-DD.
  const isoDate = $derived(
    date.toLocaleDateString("sv-SE", { timeZone: NEWS_TIME_ZONE }),
  );
  const likeCount = $derived(article.likers?.length ?? 0);
  const commentCount = $derived(article._count?.comments ?? 0);
</script>

{#snippet cover()}
  <!-- The placeholder stays underneath: a broken image paints nothing,
       and this also covers failures before hydration. -->
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
    <YoutubeThumbnail
      {videoId}
      class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      onunavailable={() => (unavailableVideoId = videoId)}
    />
  {/if}
{/snippet}

<!-- Plain text, so paragraphs run on as one line instead of stacking with gaps.
     A div: the global `p` style would add a top margin when it is not a first child. -->
{#snippet excerpt(className: string)}
  <div class={className}>{excerptText}</div>
{/snippet}

{#if variant === "editorial"}
  <article
    class="group animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] bg-card hover:bg-muted relative flex flex-col rounded-[26px] p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_14px_rgb(0_0_0/0.05)] transition-[background-color,box-shadow] duration-300 hover:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_8px_24px_rgb(0_0_0/0.08)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.3),0_4px_14px_rgb(0_0_0/0.25)]"
    style="animation-delay:{index * 50}ms"
  >
    <!-- Tinted tray: the image sits inset inside the tint with its own corners, so the
         entry reads as one unit without looking like a plain card. The tray's radius is
         the image's (rounded-lg, 20px in this theme) plus the 6px inset, so the curves
         run parallel. A soft two-layer shadow (tight edge plus wide, faint depth) lifts
         it off the page; it grows a little on hover. -->
    <div
      class="bg-muted-background relative aspect-[16/9] w-full overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10"
    >
      {@render cover()}
      {#if tags.length > 0}
        <!-- Overlaid on the cover so tags never add height to the card; one line only. -->
        <TagRow
          {tags}
          minVisible={1}
          class="pointer-events-none absolute inset-x-2.5 top-2.5"
          chipClass="shadow-sm"
          plusClass="bg-background"
        />
      {/if}
    </div>
    <!-- flex-1, so trays in a grid row stretch to the same height. The 6px tray padding
         plus this padding puts the text 12px from the tray's edge. -->
    <div class="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
      <h3 class="line-clamp-2 text-lg leading-snug break-words">
        <!-- Stretched link: the whole card is clickable, while the author link below stays usable. -->
        <svelte:element
          this={isPreview ? "span" : "a"}
          href={isPreview ? undefined : articleUrl}
          class="group-hover:underline after:absolute after:inset-0 after:content-['']"
        >
          {article.header}
        </svelte:element>
      </h3>
      {@render excerpt(
        "text-muted-foreground mt-1 line-clamp-2 text-sm break-words",
      )}
      <!-- Same meta as a list row: author and committee, then counts and date. -->
      <div
        class="text-muted-foreground mt-auto flex min-w-0 items-center gap-3 pt-3 text-sm"
      >
        <!-- The committee goes under the name: on one line, counts and date would leave
           room for neither. -->
        <span class="flex min-w-0 flex-1 items-center gap-2">
          <AuthorAvatar author={article.author} class="size-6 shrink-0" />
          <span class="flex min-w-0 flex-col leading-tight">
            {#if article.author.type !== "Custom" && !isPreview}
              <a
                href="/members/{article.author.member.studentId}"
                class="text-foreground relative z-10 truncate font-medium hover:underline"
              >
                {authorName}
              </a>
            {:else}
              <span class="text-foreground truncate font-medium">
                {authorName}
              </span>
            {/if}
            {#if article.committee}
              <span class="truncate text-xs">{article.committee.name}</span>
            {/if}
          </span>
        </span>
        {#if likeCount > 0}
          <span class="flex shrink-0 items-center gap-0.5 text-xs">
            <Heart class="size-3.5" aria-hidden="true" />
            {likeCount}
            <span class="sr-only">{m.news_likes()}</span>
          </span>
        {/if}
        {#if commentCount > 0}
          <span class="flex shrink-0 items-center gap-0.5 text-xs">
            <MessageCircle class="size-3.5" aria-hidden="true" />
            {commentCount}
            <span class="sr-only">{m.comments_title()}</span>
          </span>
        {/if}
        <time class="shrink-0 whitespace-nowrap" datetime={date.toISOString()}
          >{shortDate}</time
        >
      </div>
    </div>
  </article>
{:else}
  <div
    class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex flex-col rounded-xl border-[1px] p-4 duration-300"
    style="animation-delay:{index * 50}ms"
  >
    <svelte:element
      this={isPreview ? "div" : "a"}
      href={isPreview ? undefined : articleUrl}
      class="group block"
    >
      <div
        class="bg-muted-background relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md"
      >
        {@render cover()}
      </div>
      <h3 class="mt-2 px-2 break-words">
        {article.header}
      </h3>
      {@render excerpt("text-foreground line-clamp-2 px-2 break-words")}
    </svelte:element>
    <div class="mt-auto flex flex-row items-center justify-between pt-2">
      <AuthorCard
        member={article.author.member}
        customAuthor={article.author.customAuthor}
        position={article.author.mandate?.position}
        type={article.author.type}
        links={!isPreview}
      />
      <span class="text-muted-foreground">{isoDate}</span>
    </div>
  </div>
{/if}
