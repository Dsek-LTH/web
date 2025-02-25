<script lang="ts">
  import Card from "./Card.svelte";
  import { page } from "$app/stores";
  import { goto } from "$lib/utils/redirect";

  $: dbay = $page.data["dbay"];

  const order = ["Latest", "Oldest", "Expensive", "Cheap"];

  async function handleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const params = new URLSearchParams(window.location.search);
    params.set("order", value);
    await goto(`?${params.toString()}`, { replaceState: true });
  }
</script>

<div class="layout-container">
  <div class="mb-4 flex gap-2">
    <div class="flex-1" />

    <select id="author" class="select select-bordered" on:change={handleChange}>
      {#each order as option}
        <option value={option.toLocaleLowerCase()}> {option} </option>
      {/each}
    </select>

    <a class="btn btn-primary" href="/dbay/create">+ Post</a>
  </div>
  <main class="flex flex-col">
    {#each dbay as item, index}
      <Card {item} />
      {#if index != dbay.length - 1}
        <div class="divider" />
      {/if}
    {/each}
  </main>
</div>
