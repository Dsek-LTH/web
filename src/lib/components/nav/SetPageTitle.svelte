<script lang="ts">
  import { pageTitle } from "$lib/stores/pageTitle";
  // import { onDestroy } from "svelte";

  /**
   * The title of the page as shown in the browser tab.
   * Undefined will set the title to "D-sektionen".
   */
  export let title: string | undefined = undefined;
  // let pageTitleBefore = $pageTitle;
  // onDestroy(() => {
  //   $pageTitle = pageTitleBefore;
  // });

  $pageTitle = title ?? "D-sektionen";
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>
