<script lang="ts">
  import { goto } from "$lib/utils/redirect";
  import { page } from "$app/state";
  import { tick } from "svelte";
  import { i18n } from "$lib/utils/i18n";

  let isLoading = $state(false);

  let debouncerTimeout: number;
  let inputField: HTMLInputElement = $state();
  const refetchArticles = (search?: string) => {
    isLoading = true;
    clearTimeout(debouncerTimeout);
    debouncerTimeout = window.setTimeout(async () => {
      const urlParams = new URLSearchParams(page.url.searchParams);
      if (search !== undefined) urlParams.set("search", search);
      else urlParams.delete("search");
      urlParams.delete("page");
      await goto(`${i18n.route(page.url.pathname)}?${urlParams.toString()}`, {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
      await tick();
      setTimeout(() => {
        isLoading = false;
      }, 500);
    });
  };
</script>

<div class="relative min-w-72 flex-1">
  <input
    bind:this={inputField}
    name="search"
    type="text"
    placeholder="Search"
    class="input input-bordered w-full"
    value={page.url.searchParams.get("search") ?? ""}
    oninput={(e) => {
      refetchArticles(e.currentTarget.value);
    }}
  />
  {#if isLoading}
    <span class="loading loading-sm absolute right-4 top-1/2 -translate-y-1/2"
    ></span>
  {/if}
</div>
