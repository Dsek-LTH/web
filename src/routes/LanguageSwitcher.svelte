<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
</script>

<div class="btn btn-ghost">
  {#if languageTag() === "sv"}
    <a href={i18n.route($page.url.pathname)} hreflang="en">EN</a>
  {:else if languageTag() === "en"}
    <a href={i18n.route($page.url.pathname)} hreflang="sv">SV</a>
  {/if}
</div>
