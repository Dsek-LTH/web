<!--
@component
Remounts its children when the language changes,
which is necessary to update the translations.
Should wrap all translatable content, i.e the entire app.

Also handles some additional language-related tasks.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import {
    setLanguageTag,
    sourceLanguageTag,
    type AvailableLanguageTag,
    availableLanguageTags,
  } from "$paraglide/runtime";
  import { route } from "$lib/utils/i18nRouting";

  // Use the default language if no language is given
  $: lang = ($page.params["lang"] as AvailableLanguageTag) ?? sourceLanguageTag;
  $: setLanguageTag(lang);

  // Set the lang attribute on the <html> tag
  $: if (browser) document.documentElement.lang = lang;
</script>

<!-- SEO: Add alternate links for each language -->
<svelte:head>
  {#each availableLanguageTags as lang}
    <link
      rel="alternate"
      hreflang={lang}
      href={route($page.url.pathname, lang)}
    />
  {/each}
</svelte:head>

<!-- Remount the page when the language changes -->
{#key lang}
  <slot />
{/key}
