<!--
@component
This component should be used when you want to display a list of pages and
allow the user to navigate between them. It's responsive and will show as
many pages as possible on the screen, and will scroll if there are too many.
It works by navigating to the same page with a different query string,
e.g. `?page=1`, `?page=2`, etc. The page number is stored in the URL query.
-->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  /** The number of pages. */
  export let count: number;
  /**
   * Given a page number, return the name of the page.
   * By default pages are named 1, 2, 3, ...
   */
  export let getPageName = (n: number): string => (n + 1).toString();
  /**
   * Given a page name, return the number of the page.
   * If `getPageName` is provided, this must also be provided
   * and it must be the inverse of `getPageName`.
   */
  export let getPageNumber = (n: string): number => +n - 1;
  /**
   * The URL query string key to use for the page number, e.g `?page=1`.
   * Defaults to `"page"`.
   */
  export let fieldName = "page";
  /** Whether to show the previous page button. */
  export let showPrev = true;
  /** Whether to show the next page button. */
  export let showNext = true;
  /** Whether to show the first page button. */
  export let showFirst = false;
  /** Whether to show the last page button. */
  export let showLast = false;

  $: currentPage =
    $page.url.searchParams.get(fieldName) ?? getPageName(0).toString();

  $: getPageLink = (page: number | string) => {
    // eslint-disable-next-line svelte/valid-compile -- I think this is a bug, see https://github.com/sveltejs/svelte/issues/5162
    const searchParams = new URLSearchParams($page.url.searchParams);
    if (typeof page === "number") page = getPageName(page);
    searchParams.set(fieldName, page);
    return `?${searchParams.toString()}`;
  };

  let carousel: HTMLElement;
  let pageButtons: HTMLElement[] = [];
  function scrollToActive() {
    const active = pageButtons[getPageNumber(currentPage)];
    if (active) {
      const activeRect = active.getBoundingClientRect();
      const elRect = carousel.getBoundingClientRect();
      carousel.scrollLeft =
        activeRect.left -
        elRect.left +
        carousel.scrollLeft -
        (elRect.width - activeRect.width) / 2;
    }
  }
  afterNavigate(scrollToActive);
</script>

<div class={twMerge("join w-full", clazz)} role="listbox" tabindex="0">
  {#if showFirst}
    <a
      class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
      class:btn-disabled={currentPage == getPageName(0)}
      href={getPageLink(0)}
    >
      <span class="i-mdi-page-first" />
    </a>
  {/if}

  {#if showPrev}
    <a
      class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
      class:btn-disabled={currentPage == getPageName(0)}
      href={getPageLink(getPageNumber(currentPage) - 1)}
    >
      <span class="i-mdi-chevron-left" />
    </a>
  {/if}

  <div class="carousel join-item flex" bind:this={carousel}>
    {#each [...Array(count).keys()].map(getPageName) as page, i (page)}
      <a
        class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
        class:btn-active={page == currentPage}
        class:btn-disabled={page == currentPage}
        href={getPageLink(page)}
        bind:this={pageButtons[i]}
      >
        {page}
      </a>
    {/each}
  </div>

  {#if showNext}
    <a
      class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
      class:btn-disabled={currentPage == getPageName(count - 1)}
      href={getPageLink(getPageNumber(currentPage) + 1)}
    >
      <span class="i-mdi-chevron-right" />
    </a>
  {/if}

  {#if showLast}
    <a
      class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
      class:btn-disabled={currentPage == getPageName(count - 1)}
      href={getPageLink(count - 1)}
    >
      <span class="i-mdi-page-last" />
    </a>
  {/if}
</div>
