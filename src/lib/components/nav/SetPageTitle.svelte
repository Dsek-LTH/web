<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  /**
   * The title of the page as shown in the browser tab.
   * Undefined will set the title to "D-sektionen".
   */
  export let title: string | undefined = undefined;

  let pageTitle = getContext<Writable<string>>("pageTitle");
  $pageTitle = title ?? "D-sektionen";
  $: $pageTitle = title ?? "D-sektionen";
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>
