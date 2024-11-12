<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import "../app.css";
  import { languageTag } from "$paraglide/runtime";
  import dayjs from "dayjs";
  /* Recommended for fraud detection */
  import "@stripe/stripe-js";
  import { onMount } from "svelte";
  import { setDefaultFlags } from "$lib/utils/featureFlag";

  export let data;

  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();

  onMount(() => {
    setDefaultFlags();
  });
</script>

<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}
</svelte:head>

<ParaglideJS {i18n}>
  <slot />
</ParaglideJS>
