<!--
@component
This component should be used when you want to display a list of pages and
allow the user to navigate between them. It's responsive and will show as
many pages as possible on the screen, and will scroll if there are too many.
It works by navigating to the same page with a different query string,
e.g. `?page=1`, `?page=2`, etc. The page number is stored in the URL query.
-->
<script lang="ts">
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  let clazz: string = "";
  export { clazz as class };
  /** The number of pages. */
  export let count: number;
  /**
   * Given a page number, return the name of the page.
   * By default pages are named 1, 2, 3, ...
   */
  export let getPageName = (n: number): string => (n + 1).toString();
  /**
   * The URL query string key to use for the page number, e.g `?page=1`.
   * Defaults to `"page"`.
   */
  export let fieldName = "page";

  $: currentPage =
    $page.url.searchParams.get(fieldName) ?? getPageName(0).toString();

  $: getPageLink = (page: number | string) => {
    // eslint-disable-next-line svelte/valid-compile -- I think this is a bug, see https://github.com/sveltejs/svelte/issues/5162
    const searchParams = new URLSearchParams($page.url.searchParams);
    if (typeof page === "number") page = getPageName(page);
    searchParams.set(fieldName, page);
    return `?${searchParams.toString()}`;
  };

  function scrollToActive(node: HTMLElement) {
    const active = node.querySelector(".btn-active");
    if (active) {
      const activeRect = active.getBoundingClientRect();
      const elRect = node.getBoundingClientRect();
      node.scrollLeft =
        activeRect.left -
        elRect.left +
        node.scrollLeft -
        (elRect.width - activeRect.width) / 2;
    }
  }
</script>

<div class={twMerge("join w-full", clazz)}>
  <a
    class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
    class:btn-disabled={currentPage == getPageName(0)}
    href={getPageLink(0)}
  >
    <span class="i-mdi-page-first" />
  </a>

  <!-- #key forces a remount on page change to trigger scrollToActive -->
  {#key currentPage}
    <div class="carousel join-item flex" use:scrollToActive>
      {#each [...Array(count).keys()].map(getPageName) as page (page)}
        <a
          class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
          class:btn-active={page == currentPage}
          class:btn-disabled={page == currentPage}
          href={getPageLink(page)}
        >
          {page}
        </a>
      {/each}
    </div>
  {/key}

  <a
    class="btn carousel-item join-item btn-xs sm:btn-sm md:btn-md"
    class:btn-disabled={currentPage == getPageName(count - 1)}
    href={getPageLink(count - 1)}
  >
    <span class="i-mdi-page-last" />
  </a>
</div>
