<script lang="ts">
  import dayjs from "dayjs";
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { getFlash } from "sveltekit-flash-message";
  /* Recommended for fraud detection */
  import "@stripe/stripe-js";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { getLocale } from "$paraglide/runtime";
  import { toast } from "$lib/stores/toast";
  import { page } from "$app/state";

  const { children, data } = $props();

  dayjs.locale(getLocale());
  let pageTitle = writable("D-sektionen");
  setContext("pageTitle", pageTitle);
  const flash = getFlash(page);
  $effect(() => {
    if ($flash) {
      toast($flash.message, $flash.type, $flash.id);
    }
  });
</script>

<ModeWatcher />
<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}
</svelte:head>

{@render children?.()}
