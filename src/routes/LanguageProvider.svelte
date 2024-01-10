<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import {
    setLanguageTag,
    sourceLanguageTag,
    type AvailableLanguageTag,
  } from "$intl/runtime";

  // Use the default language if no language is given
  $: lang = ($page.params["lang"] as AvailableLanguageTag) ?? sourceLanguageTag;
  $: setLanguageTag(lang);

  // Set the lang attribute on the <html> tag
  $: if (browser) document.documentElement.lang = lang;
</script>

<!-- Remount the page when the language changes -->
{#key lang}
  <slot />
{/key}
