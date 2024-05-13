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
  import { enhance } from "$app/forms";
  import TagSelectCreate from "./TagSelectCreate.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";

  export let data: PageData;

  const {
    form: createLinksForm,
    errors: createLinksErrors,
    constraints: createLinksConstraints,
    enhance: createLinksEnhance,
  } = superForm(data.createLinksForm, { invalidateAll: true, resetForm: true });

  $: query = new URLSearchParams($page.url.searchParams.toString());

  const setUrlParams = (order: ShlinkShortUrlsOrder) => {
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

  let createSelectedTags: Tag[] = [];

  const tableHeaders: [{ order: ShlinkShortUrlsOrder; title: string }] = [
    { order: { field: "shortCode" }, title: "Slug" },
    { order: { field: "longUrl" }, title: "Link" },
    { order: { field: null }, title: "Tags" },
    { order: { field: "dateCreated" }, title: "Created date" },
    { order: { field: "visits" }, title: "Visits" },
  ];

  const allTags: Tag[] = data.tags.map((t) => ({ id: t, name: t }));
  let filteredTags: Tag[] = allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );
  let searchForm: HTMLFormElement;

  let removeModal: HTMLDialogElement | undefined = undefined;
  let toggleAllCheckBox: HTMLInputElement;
  let checkboxes: boolean[] = [];
  const resetCheckboxes = () => {
    checkboxes = [];
    if (toggleAllCheckBox) {
      toggleAllCheckBox.checked = false;
    }
  };
  $: if (data.domains) {
    resetCheckboxes();
  }
</script>

<PageHeader title="Link shortener" />

<div class="mb-10 mt-4 rounded-lg md:p-4 lg:mb-4 lg:p-8">
  <h2 class="text-lg font-semibold">Add Shorted Link</h2>
  <form
    class="flex flex-col items-stretch gap-2 lg:flex-row lg:items-end"
    action="?/create"
    method="post"
    use:createLinksEnhance
  >
    <Input
      name="slug"
      label="Custom slug"
      required
      bind:value={$createLinksForm.slug}
      error={$createLinksErrors.slug}
      {...$createLinksConstraints}
    />
    <Input
      name="url"
      label="URL"
      placeholder="URL to be shortened"
      required
      bind:value={$createLinksForm.url}
      error={$createLinksErrors.url}
      {...$createLinksConstraints}
    />
    <TagSelectCreate {allTags} bind:selectedTags={createSelectedTags} />
    {#each createSelectedTags as tag (tag.id)}
      <input type="hidden" name="tags" value={tag.name} />
    {/each}
    <button class="btn btn-primary">Add</button>
  </form>
</div>

<form action="?/delete" method="post" use:enhance>
  <div class="flex items-end gap-2">
    <button
      type="button"
      class="btn btn-square btn-error place-self-end"
      disabled={checkboxes.every((c) => !c)}
      on:click={(_e) => removeModal?.showModal()}
    >
      <span class="i-mdi-trash-can"></span>
    </button>
    <form
      method="get"
      class="form-control flex-1 gap-2 md:flex-row md:items-end"
      id="filter-form"
      bind:this={searchForm}
    >
      <TagSelector
        {allTags}
        bind:selectedTags={filteredTags}
        onChange={() => setTimeout(() => searchForm.requestSubmit())}
      />
      <SearchBar />
      {#each filteredTags as tag (tag.id)}
        <input type="hidden" name="tags" value={tag.name} />
      {/each}
    </form>
  </div>

  <dialog bind:this={removeModal} class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Remove links</h3>
      <p class="py-4">
        Are you sure you want to remove {checkboxes.filter((c) => c).length} link(s)?
      </p>
      <p class="text-xs text-base-content/60">
        {data.domains
          .filter((_, i) => checkboxes.at(i))
          .map(({ shortCode }) => shortCode)
          .join(", ")}
      </p>
      <div class="modal-action">
        <button
          type="submit"
          class="btn btn-error"
          on:click={() => removeModal?.close()}
        >
          Remove
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button class="cursor-auto" />
    </form>
  </dialog>

  <div class="overflow-x-auto">
    <table class="table my-4">
      <thead>
        <tr class="bg-base-200">
          <th>
            <input
              type="checkbox"
              class="checkbox"
              bind:this={toggleAllCheckBox}
              on:change={(e) =>
                (checkboxes = [...Array(data.domains.length).keys()].map(
                  (c) => e.target.checked,
                ))}
            />
          </th>
          {#each tableHeaders as th (th.title)}
            {#if th.order.field}
              <th
                on:click={() => setUrlParams({ field: th.order.field })}
                class="cursor-pointer"
              >
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
        {#each data.domains as d, i (d.shortCode)}
          {@const date = new Date(d.dateCreated)}
          <tr>
            <td>
              <input
                type="checkbox"
                class="checkbox"
                name="deleting"
                value={d.shortCode}
                bind:checked={checkboxes[i]}
              />
            </td>
            <td class="font-medium">
              {d.shortCode}
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
</form>

<!-- TODO: Copy Shlink Admin UI's scroll effect? -->
<Pagination count={data.pagination.pagesCount} />
