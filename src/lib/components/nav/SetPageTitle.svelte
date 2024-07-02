<script lang="ts">
  import { pageTitle } from "$lib/stores/pageTitle";

  export let title: string | undefined;
  $pageTitle = title ?? "D-sektionen";
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>
