<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import NewsSearch from "./NewsSearch.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Pagination from "$lib/components/Pagination.svelte";
  import ArticleCard from "$lib/components/ArticleCard.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import List from "@lucide/svelte/icons/list";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import CalendarClock from "@lucide/svelte/icons/calendar-clock";
  import { formatDateTimeShort } from "$lib/news/format";
  import { toAppTime } from "$lib/utils/datetime";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Plus from "@lucide/svelte/icons/plus";
  import Tags from "@lucide/svelte/icons/tags";
  import NewsList from "./NewsList.svelte";
  import {
    isNewsViewMode,
    saveNewsViewMode,
    type NewsViewMode,
  } from "$lib/news/viewMode";

  let { data } = $props();

  const canCreate = $derived(isAuthorized(apiNames.NEWS.CREATE, data.user));
  const canManageTags = $derived(isAuthorized(apiNames.TAGS.UPDATE, data.user));

  // Initial value comes from the cookie (read on the server), so SSR renders the right view.
  let viewMode = $derived(data.viewMode);

  const setViewMode = (value: NewsViewMode) => {
    viewMode = value;
    saveNewsViewMode(value);
  };

  const viewOptions = [
    { value: "cards", label: m.news_view_cards, icon: LayoutGrid },
    { value: "list", label: m.news_view_list, icon: List },
  ] as const;

  const rangeFrom = $derived(
    data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1,
  );
  const rangeTo = $derived(
    Math.min(data.page * data.pageSize, data.totalCount),
  );
  const rangeLabel = $derived(
    m.news_showingRange({
      from: rangeFrom,
      to: rangeTo,
      total: data.totalCount,
    }),
  );

  let showNollning = $state(false);

  const formatDateTime = (date: Date | null) =>
    toAppTime(date).format("YYYY-MM-DD HH:mm");

  // Scheduled row: arrows and edge fades only show when there is something to scroll.
  let scheduledRow = $state<HTMLElement>();
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  const updateScheduledScroll = () => {
    if (!scheduledRow) return;
    const { scrollLeft, scrollWidth, clientWidth } = scheduledRow;
    // 1px slack: scroll positions can be fractional on zoomed or high-DPI screens.
    canScrollLeft = scrollLeft > 1;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
  };

  const scrollScheduled = (direction: 1 | -1) =>
    scheduledRow?.scrollBy({
      left: direction * scheduledRow.clientWidth,
      behavior: "smooth",
    });

  $effect(() => {
    // Read so the cards are observed again when the list changes.
    if (!scheduledRow || data.scheduledArticles.length === 0) return;
    // Recheck when the row resizes (window width, cards loading in).
    const observer = new ResizeObserver(updateScheduledScroll);
    observer.observe(scheduledRow);
    for (const card of scheduledRow.children) observer.observe(card);
    return () => observer.disconnect();
  });

  const scheduledMask = $derived(
    canScrollLeft || canScrollRight
      ? `linear-gradient(to right, ${canScrollLeft ? "transparent" : "black"}, black 3rem, black calc(100% - 3rem), ${canScrollRight ? "transparent" : "black"})`
      : undefined,
  );
</script>

<SetPageTitle title={m.news()} />
<SEO
  data={{
    type: "website",
    props: {
      title: "D-sektionen",
      description: m.landing_intro(),
    },
  }}
/>

<!-- Rows linking to the editor, for the author-only panels below. -->
{#snippet editLinks(
  articles: Array<{
    id: string;
    slug: string;
    header: string;
    publishedAt: Date | null;
  }>,
)}
  <ul class="ml-0 list-none divide-y [&>li]:my-0">
    {#each articles as article (article.id)}
      <li>
        <a
          href="/news/{article.slug}/edit"
          class="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors"
        >
          <span class="font-medium">{article.header}</span>
          <span class="text-muted-foreground shrink-0">
            {#if article.publishedAt && new Date(article.publishedAt) > new Date()}
              {m.news_scheduledFor()}
            {/if}
            {formatDateTime(article.publishedAt)}
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- The author-only lists (scheduled, nollning) are framed panels; the public article
     list is not, so the news itself sits directly on the page. -->
<div class="flex flex-col gap-6 pt-4 pb-8">
  <!-- Page-level actions live here, above the author panels, so they are always in reach.
       The list toolbar below only holds controls that affect the list itself. -->
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-3xl">{m.news()}</h1>
    {#if canCreate || canManageTags}
      <div class="flex items-center gap-2">
        {#if canManageTags}
          <Button variant="outline" href="/news/tags">
            <Tags />
            {m.news_manageTags()}
          </Button>
        {/if}
        {#if canCreate}
          <Button href="/news/create">
            <Plus />
            {m.news_newArticle()}
          </Button>
        {/if}
      </div>
    {/if}
  </div>

  {#if data.scheduledArticles.length > 0}
    <section class="flex flex-col gap-3">
      <header class="flex items-center gap-2">
        <h2 class="text-base">{m.news_scheduledNews()}</h2>
        <span class="text-muted-foreground text-sm"
          >{data.scheduledArticles.length}</span
        >
        {#if canScrollLeft || canScrollRight}
          <div class="ml-auto flex gap-1">
            <Button
              variant="outline"
              size="icon"
              class="size-8"
              aria-label={m.news_scheduledPrevious()}
              disabled={!canScrollLeft}
              onclick={() => scrollScheduled(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="size-8"
              aria-label={m.news_scheduledNext()}
              disabled={!canScrollRight}
              onclick={() => scrollScheduled(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        {/if}
      </header>
      <!-- Same cards as the grid below, one column wide, scrolling sideways when there
           are more than fit. The padding keeps the cards' shadows from being clipped.
           An edge fades out while there is more to scroll in that direction. -->
      <div
        bind:this={scheduledRow}
        onscroll={updateScheduledScroll}
        class="-mx-2 flex snap-x scroll-px-2 [scrollbar-width:thin] gap-6 overflow-x-auto px-2 pt-1 pb-4"
        style:mask-image={scheduledMask}
      >
        {#each data.scheduledArticles as article, index (article.id)}
          <div
            class="flex w-[85%] shrink-0 snap-start flex-col gap-2 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            {#if article.publishedAt}
              <span
                class="text-muted-foreground flex items-center gap-1.5 px-1.5 text-sm"
              >
                <CalendarClock class="size-4 shrink-0" aria-hidden="true" />
                <span class="truncate">
                  {m.news_scheduledFor()}
                  <time datetime={article.publishedAt.toISOString()}>
                    {formatDateTimeShort(article.publishedAt)}
                  </time>
                </span>
              </span>
            {/if}
            <ArticleCard
              {article}
              {index}
              variant="editorial"
              tags={article.tags}
              href="/news/{article.slug}/edit"
            />
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if data.nollningArticles.length > 0}
    <section class="rounded-xl border">
      <button
        type="button"
        class="hover:bg-muted/50 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition-colors"
        class:rounded-b-none={showNollning}
        class:border-b={showNollning}
        aria-expanded={showNollning}
        onclick={() => (showNollning = !showNollning)}
      >
        <h2 class="text-base">{m.news_nollningNews()}</h2>
        <span class="text-muted-foreground text-sm"
          >{data.nollningArticles.length}</span
        >
        <span class="text-muted-foreground ml-auto text-sm">
          {showNollning ? m.news_hideNollningNews() : m.news_showNollningNews()}
        </span>
        <ChevronDown
          class="text-muted-foreground size-4 transition-transform {showNollning
            ? 'rotate-180'
            : ''}"
        />
      </button>
      {#if showNollning}
        {@render editLinks(data.nollningArticles)}
      {/if}
    </section>
  {/if}

  <section class="flex flex-col gap-6">
    <header class="flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <NewsSearch />
      </div>
      <span
        class="text-muted-foreground hidden shrink-0 text-sm tabular-nums sm:inline"
      >
        {rangeLabel}
      </span>
      <!-- Icon-only and muted when active: view state should not compete with the primary action.
           The getter/setter binding ignores deselection, so one view is always selected. -->
      <Tooltip.Provider>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          aria-label={m.news_view()}
          bind:value={
            () => viewMode,
            (value) => {
              if (isNewsViewMode(value)) setViewMode(value);
            }
          }
        >
          {#each viewOptions as option (option.value)}
            {@const Icon = option.icon}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <ToggleGroup.Item
                    {...props}
                    value={option.value}
                    aria-label={option.label()}
                    class="text-muted-foreground data-[state=on]:text-foreground size-9"
                  >
                    <Icon />
                  </ToggleGroup.Item>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>{option.label()}</Tooltip.Content>
            </Tooltip.Root>
          {/each}
        </ToggleGroup.Root>
      </Tooltip.Provider>
    </header>

    {#if data.articles.length === 0}
      <p class="text-muted-foreground py-16 text-center">
        {m.news_noArticlesFound()}
      </p>
    {:else if viewMode === "list"}
      <NewsList articles={data.articles} />
    {:else}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.articles as article, index (article.id)}
          <ArticleCard
            {article}
            {index}
            variant="editorial"
            tags={article.tags}
          />
        {/each}
      </div>
    {/if}

    <!-- The count sits in the toolbar from sm up; on phones the toolbar has no room, so it stays here. -->
    <footer
      class="text-muted-foreground flex flex-col items-center gap-2 text-sm {data.pageCount <=
      1
        ? 'sm:hidden'
        : ''}"
    >
      <span class="tabular-nums sm:hidden">{rangeLabel}</span>
      {#if data.pageCount > 1}
        <Pagination pageCount={data.pageCount} class="justify-center" />
      {/if}
    </footer>
  </section>
</div>
