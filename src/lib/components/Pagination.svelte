<script lang="ts">
  import { page } from "$app/stores";

  $: currentPage = Number.parseInt($page.url.searchParams.get("page") ?? "0");
  export let pages: number = 1;
  $: generateLinkForPage = (pageNumber: number) => {
    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.set("page", pageNumber.toString());
    return `?${searchParams.toString()}`;
  };
</script>

<div class="join">
  <a
    class="btn join-item {currentPage == 1 ? 'btn-disabled' : ''}"
    href={generateLinkForPage(currentPage - 1)}>«</a
  >
  {#if pages <= 5}
    {#each Array.from({ length: pages }).map((_, i) => i + 1) as page (page)}
      <a
        class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
        href={generateLinkForPage(page)}
      >
        {page}
      </a>
    {/each}
  {:else}
    <a
      class="btn join-item {currentPage == 1 ? 'btn-disabled btn-active' : ''}"
      href={generateLinkForPage(1)}
    >
      {1}
    </a>
    {#if currentPage < 5}
      {#each Array.from({ length: 4 }).map((_, i) => i + 2) as page (page)}
        <a
          class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
          href={generateLinkForPage(page)}
        >
          {page}
        </a>
      {/each}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
    {:else if currentPage > pages - 3}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
      {#each Array.from({ length: 4 }).map((_, i) => i + pages - 3) as page (page)}
        <a
          class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
          href={generateLinkForPage(page)}
        >
          {page}
        </a>
      {/each}
    {:else}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
      {#each Array.from({ length: 3 }).map((_, i) => i + currentPage - 1) as page (page)}
        <a
          class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
          href={generateLinkForPage(page)}
        >
          {page}
        </a>
      {/each}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
    {/if}

    <a
      class="btn join-item {currentPage == pages + 1 ? 'btn-disabled btn-active' : ''}"
      href={generateLinkForPage(pages + 1)}
    >
      {pages + 1}
    </a>
  {/if}
  <a
    class="btn join-item {currentPage == pages + 1 ? 'btn-disabled' : ''}"
    href={generateLinkForPage(currentPage + 1)}>»</a
  >
</div>
