<script lang="ts">
  import { goto } from "$app/navigation";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import type { ShlinkShortUrlsOrder } from "@shlinkio/shlink-js-sdk/api-contract";
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import SearchBar from "$lib/components/SearchBar.svelte";

  export let data: PageData;

  $: query = new URLSearchParams($page.url.searchParams.toString());

  const set_url_params = (order: ShlinkShortUrlsOrder) => {
    if (
      query.get("orderBy") === order.field ||
      (!query.has("orderBy") && order.field === "dateCreated")
    ) {
      if (query.has("dir")) {
        query.delete("dir");
      } else {
        query.set("dir", "ASC");
      }
    } else {
      query.delete("dir");
    }
    query.set("orderBy", order.field);
    goto(`?${query.toString()}`);
  };

  const table_headers: [{ order: ShlinkShortUrlsOrder; title: string }] = [
    { order: { field: "shortCode" }, title: "Slug" },
    { order: { field: "longUrl" }, title: "Link" },
    { order: { field: null }, title: "Tags" },
    { order: { field: "dateCreated" }, title: "Created date" },
    { order: { field: "visits" }, title: "Visits" },
  ];

  const allTags = data.tags.map((t) => ({ id: t, name: t }));

  let filteredTags: Tag[] = allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );

  let form: HTMLFormElement;
</script>

<PageHeader title="Link shortener" />

<form
  method="get"
  class="form-control flex-1 gap-2 md:flex-row md:items-end"
  id="filter-form"
  bind:this={form}
>
  <TagSelector
    {allTags}
    bind:selectedTags={filteredTags}
    onChange={() => setTimeout(() => form.requestSubmit())}
  />
  <SearchBar />
  {#each filteredTags as tag (tag.id)}
    <input type="hidden" name="tags" value={tag.name} />
  {/each}
</form>

<div class="overflow-x-auto">
  <table class="table my-4">
    <thead>
      <tr class="cursor-pointer bg-base-200">
        {#each table_headers as th (th.title)}
          {#if th.order.field}
            <th on:click={() => set_url_params({ field: th.order.field })}>
              {th.title}
              {#if query.get("orderBy") === th.order.field || (!query.has("orderBy") && th.order.field === "dateCreated")}
                {#if query.get("dir") === "ASC"}
                  <span class="i-mdi-triangle-down"></span>
                {:else}
                  <span class="i-mdi-triangle"></span>
                {/if}
              {/if}
            </th>
          {:else}
            <th class="cursor-text">
              {th.title}
            </th>
          {/if}
        {/each}
        <th />
      </tr>
    </thead>
    <tbody>
      {#each data.domains as d (d.shortCode)}
        {@const date = new Date(d.dateCreated)}
        <tr>
          <td class="font-medium">
            <a href={d.shortUrl}>
              {d.shortCode}
            </a>
          </td>
          <td>
            <a href={d.longUrl}>
              {d.longUrl}
            </a>
          </td>
          <td>
            {d.tags.join(", ")}
          </td>
          <td>
            {date.getFullYear()}-{String(date.getMonth()).padStart(
              2,
              "0",
            )}-{String(date.getDate()).padStart(2, "0")}
          </td>
          <td>
            <div
              class="tooltip"
              data-tip={`nonBots: ${d.visitsSummary?.nonBots}, bots: ${d.visitsSummary?.bots}`}
            >
              {d.visitsSummary?.total}
            </div>
          </td>
          <td class="text-right">
            <a class="btn btn-xs px-8" href={`links/${d.shortCode}`}>Edit</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<Pagination count={data.pagination.pagesCount} />
