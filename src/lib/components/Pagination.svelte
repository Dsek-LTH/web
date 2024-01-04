<script lang="ts">
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  let clazz: string = "";
  export { clazz as class };
  export let count: number;
  export let getPageName = (n: number): string => (n + 1).toString();
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
