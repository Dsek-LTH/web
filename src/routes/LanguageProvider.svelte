<script lang="ts">
  import { page } from "$app/stores";
  import {
    setLanguageTag,
    sourceLanguageTag,
    type AvailableLanguageTag,
  } from "$intl/runtime";

  //Use the default language if no language is given
  $: lang = ($page.params["lang"] as AvailableLanguageTag) ?? sourceLanguageTag;
  $: setLanguageTag(lang);
</script>

<!-- Remount the page when the language changes -->
{#key lang}
  <slot />
{/key}
