<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import "@stripe/stripe-js"; /* Recommended for fraud detection */
  import "../app.css";
  export let data;
</script>

<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}
</svelte:head>

{#if !data.isApp}
  <a
    class="btn btn-circle btn-primary fixed bottom-4 right-4 z-20"
    href="https://forms.gle/skDsfLGyQHuCYGcR7"
    target="_blank"
  >
    <span class="i-mdi-feedback" />
  </a>
{/if}

<ParaglideJS {i18n}>
  <slot />
</ParaglideJS>
