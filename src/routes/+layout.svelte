<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { languageTag } from "$paraglide/runtime";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import dayjs from "dayjs";
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  /* Recommended for fraud detection */
  import "@stripe/stripe-js";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import DarkmodeToggle from "./DarkmodeToggle.svelte";

  export let data;

  // eslint-disable-next-line svelte/no-immutable-reactive-statements
  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();
  let pageTitle = writable("D-sektionen");
  setContext("pageTitle", pageTitle);
</script>

<ModeWatcher />
<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}
</svelte:head>

<div class="p-2">
  <DarkmodeToggle />
</div>
<ParaglideJS {i18n}>
  <slot />
</ParaglideJS>
