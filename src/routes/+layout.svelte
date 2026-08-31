<script lang="ts">
  import { getLocale } from "$paraglide/runtime";
  import dayjs from "dayjs";
  import "../app.css";
  /* Recommended for fraud detection */
  import "@stripe/stripe-js";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  export let data;

  $: (() => {
    const locale = getLocale();
    dayjs.locale(locale);
  })();
  let pageTitle = writable("D-sektionen");
  setContext("pageTitle", pageTitle);
</script>

<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}
</svelte:head>

<slot />
