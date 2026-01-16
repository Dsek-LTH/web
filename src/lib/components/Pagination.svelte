<script lang="ts">
  import { page } from "$app/state";
  import * as Pagination from "$lib/components/ui/pagination";
  import { cn } from "$lib/utils";

  let { pageCount = 10, class: klass }: { pageCount?: number; class?: string } =
    $props();

  let thisPage = $derived(
    Number.parseInt(page.url.searchParams?.get("page") ?? "1"),
  );
</script>

<Pagination.Root class={cn(klass, "w-full")} count={pageCount} perPage={1}>
  {#snippet children({ pages })}
    <Pagination.Content>
      <Pagination.Item data-sveltekit-preload-data="off">
        {#if thisPage > 1}
          <a data-sveltekit-preload-code="off" href={`?page=${thisPage - 1}`}>
            <Pagination.PrevButton />
          </a>
        {:else}
          <Pagination.PrevButton />
        {/if}
      </Pagination.Item>
      {#each pages as pageItem (pageItem.key)}
        {#if pageItem.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item data-sveltekit-preload-data="off">
            <Pagination.Link
              page={pageItem}
              href={`?page=${pageItem.value}`}
              isActive={thisPage == pageItem.value}
            >
              {#snippet child({ props })}
                <a {...props}>
                  {pageItem.value}
                </a>
              {/snippet}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item data-sveltekit-preload-data="off">
        <a href={`?page=${thisPage + 1}`}>
          <Pagination.NextButton />
        </a>
      </Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>
