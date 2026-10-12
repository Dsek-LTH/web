<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import * as messages from "$paraglide/messages";

  /**
   * The title of the page as shown in the browser tab.
   * Undefined will set the title to `messages.the_d_guild()`.
   */
  export let title: string | undefined = undefined;

  let pageTitle = getContext<Writable<string>>("pageTitle");
  $pageTitle = title ?? messages.the_d_guild();
  $: $pageTitle = title ?? messages.the_d_guild();
</script>

<svelte:head>
  {#if title}
    <title>{title} | {messages.the_d_guild()}</title>
  {:else}
    <title>{messages.the_d_guild()}</title>
  {/if}
</svelte:head>
