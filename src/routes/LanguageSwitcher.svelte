<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { route } from "$lib/utils/i18nRouting";
</script>

<div class="btn btn-ghost">
  {#if languageTag() === "sv"}
    <a href={route($page.url.pathname, "en")} hreflang="en">EN</a>
  {:else if languageTag() === "en"}
    <a href={route($page.url.pathname, "sv")} hreflang="sv">SV</a>
  {/if}
</div>
