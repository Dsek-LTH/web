<script lang="ts">
  import { page } from "$app/state";
  import * as Pagination from "$lib/components/ui/pagination";
  import { SvelteURLSearchParams } from "svelte/reactivity";

  let { pageCount = 10 }: { pageCount?: number } = $props();

  const searchParams = $derived(
    new SvelteURLSearchParams(page.url.searchParams),
  );
  let thisPage = $derived(Number.parseInt(searchParams.get("page") ?? "0"));

  const getPageLink = $derived((p: number) => {
    return `?page=${p}`;
  });
</script>

<Pagination.Root class="w-full" count={pageCount} perPage={1}>
  {#snippet children({ pages, currentPage })}
    <Pagination.Content>
      <Pagination.Item>
        {#if thisPage > 1}
          <a href={getPageLink(thisPage - 1)}>
            <Pagination.PrevButton />
          </a>
        {:else}
          <Pagination.PrevButton />
        {/if}
      </Pagination.Item>
      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item>
            <Pagination.Link
              {page}
              href={getPageLink(currentPage)}
              isActive={currentPage === page.value}
            >
              {#snippet child({ props })}
                <a {...props}>
                  {page.value}
                </a>
              {/snippet}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item>
        <a href={getPageLink(thisPage + 1)}>
          <Pagination.NextButton />
        </a>
      </Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>
