<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
</script>

{#if languageTag() === "sv"}
  <a href={i18n.route($page.url.pathname)} class="btn btn-ghost" hreflang="en">
    EN
  </a>
{:else if languageTag() === "en"}
  <a href={i18n.route($page.url.pathname)} class="btn btn-ghost" hreflang="sv">
    SV
  </a>
{/if}
