<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  let selectedTags;
</script>

<PageHeader title="Link shortener" />

<div>
  <div class="my-4 rounded-lg p-4">
    <div class="border-b border-neutral p-4">
      Hello World! <br />
      {#each data.tags as t}
        {t}
      {/each}
    </div>
  </div>
</div>

<div class="overflow-x-auto">
  <h1 class="my-4 text-2xl font-bold">Links</h1>
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Slug</th>
        <th>Link</th>
        <th>Tags</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each data.domains as { shortCode, longUrl, tags } (shortCode)}
        <tr>
          <td class="font-medium">{shortCode}</td>
          <td>
            {longUrl}
          </td>
          <td>
            {tags}
          </td>
          <td class="text-right">
            <a class="btn btn-xs px-8" href={`links/${shortCode}`}>Ändra</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<Pagination count={data.pagination.pagesCount} />
