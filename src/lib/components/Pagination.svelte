<script lang="ts">
  import { page } from "$app/stores";

  $: currentPage = Number.parseInt(
    $page.url.searchParams.get(fieldName) ?? getNumber(1).toString()
  );
  export let pages: number = 1;
  export let getNumber = (n: number) => n;
  export let reverseGetNumber = (n: number) => n;
  export let fieldName = "page";
  $: generateLinkForPage = (pageNumber: number) => {
    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.set(fieldName, pageNumber.toString());
    return `?${searchParams.toString()}`;
  };
</script>

<div class="join">
  <a
    class="btn join-item {currentPage == getNumber(1) ? 'btn-disabled' : ''}"
    href={generateLinkForPage(getNumber(reverseGetNumber(currentPage) - 1))}>«</a
  >
  {#if pages <= 5}
    {#each Array.from({ length: pages })
      .map((_, i) => i + 1)
      .map(getNumber) as page (page)}
      <a
        class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
        href={generateLinkForPage(page)}
      >
        {page}
      </a>
    {/each}
  {:else}
    <a
      class="btn join-item {currentPage == getNumber(1) ? 'btn-disabled btn-active' : ''}"
      href={generateLinkForPage(getNumber(1))}
    >
      {getNumber(1)}
    </a>
    {#if reverseGetNumber(currentPage) < 5}
      {#each Array.from({ length: 4 })
        .map((_, i) => i + 2)
        .map(getNumber) as page (page)}
        <a
          class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
          href={generateLinkForPage(page)}
        >
          {page}
        </a>
      {/each}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
    {:else if reverseGetNumber(currentPage) > pages - 3}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
      {#each Array.from({ length: 4 })
        .map((_, i) => i + pages - 4)
        .map(getNumber) as page (page)}
        <a
          class="btn join-item {page == currentPage ? 'btn-disabled btn-active' : ''}"
          href={generateLinkForPage(page)}
        >
          {page}
        </a>
      {/each}
    {:else}
      <a class="btn btn-disabled join-item" href="/"> ... </a>
      {#each Array.from({ length: 3 })
        .map((_, i) => i + reverseGetNumber(currentPage) - 1)
        .map(getNumber) as page (page)}
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
      class="btn join-item {currentPage == getNumber(pages) ? 'btn-disabled btn-active' : ''}"
      href={generateLinkForPage(getNumber(pages))}
    >
      {getNumber(pages)}
    </a>
  {/if}
  <a
    class="btn join-item {currentPage == getNumber(pages) ? 'btn-disabled' : ''}"
    href={generateLinkForPage(getNumber(reverseGetNumber(currentPage) + 1))}>»</a
  >
</div>
