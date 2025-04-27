<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  interface Props {
    /**
     * The title of the page as shown in the browser tab.
     * Undefined will set the title to "D-sektionen".
     */
    title?: string | undefined;
  }

  let { title = undefined }: Props = $props();

  let pageTitle = getContext<Writable<string>>("pageTitle");
  $pageTitle = title ?? "D-sektionen";
  $effect(() => {
    $pageTitle = title ?? "D-sektionen";
  });
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>
