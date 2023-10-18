<script lang="ts">
  import { page } from "$app/stores";
  import type { Article } from "$lib/articles";
  import type { Tag } from "@prisma/client";

  export let onResult: (result: Article[]) => void;
  export let filteredTags: Tag[] = [];
  let isLoading = false;

  let debouncerTimeout: number;
  const refetchArticles = async (search?: string) => {
    isLoading = true;
    clearTimeout(debouncerTimeout);
    debouncerTimeout = window.setTimeout(async () => {
      const urlParams = new URLSearchParams(filteredTags.map((tag) => ["tags", tag.name]));
      if (search) urlParams.set("search", search);
      const result = await fetch(`/news?${urlParams.toString()}`).then((res) => res.json());
      onResult(result);
      isLoading = false;
    }, 200);
  };
</script>

<div class="relative flex-1">
  <input
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
