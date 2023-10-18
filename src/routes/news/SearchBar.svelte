<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type { Tag } from "@prisma/client";
  import { tick } from "svelte";

  export let filteredTags: Tag[] = [];
  let isLoading = false;

  let debouncerTimeout: number;
  let inputField: HTMLInputElement;
  const refetchArticles = async (search?: string) => {
    isLoading = true;
    clearTimeout(debouncerTimeout);
    debouncerTimeout = window.setTimeout(async () => {
      const urlParams = new URLSearchParams(filteredTags.map((tag) => ["tags", tag.name]));
      if (search) urlParams.set("search", search);
      await goto(`/news?${urlParams.toString()}`, { replaceState: true });
      await tick();
      setTimeout(() => {
        inputField.focus();
        isLoading = false;
      }, 0);
    }, 200);
  };
</script>

<div class="relative flex-1">
  <input
    bind:this={inputField}
    name="search"
    type="text"
    placeholder="Search"
    class="input input-bordered w-full focus:border-primary-focus"
    value={$page.url.searchParams.get("search") ?? ""}
    on:input={(e) => {
      refetchArticles(e.currentTarget.value);
    }}
  />
  {#if isLoading}
    <span class="loading loading-sm absolute right-4 top-1/2 -translate-y-1/2"></span>
  {/if}
</div>
