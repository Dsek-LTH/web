<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
</script>

{#if languageTag() === "sv"}
  <a
    href={i18n.route($page.url.pathname)}
    class="btn btn-ghost"
    hreflang="en"
    on:click={() => invalidateAll()}
  >
    EN
  </a>
{:else if languageTag() === "en"}
  <a
    href={i18n.route($page.url.pathname)}
    class="btn btn-ghost"
    hreflang="sv"
    on:click={() => invalidateAll()}
  >
    SV
  </a>
{/if}
