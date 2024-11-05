<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import { twMerge } from "tailwind-merge";

  let originalLang = languageTag();
  let clazz = "";
  export { clazz as class };
</script>

<a
  class={twMerge("btn btn-ghost", clazz)}
  href={i18n.route($page.url.pathname)}
  hreflang={languageTag() === "sv" ? "en" : "sv"}
  on:click={() => {
    if (originalLang != languageTag()) {
      invalidateAll();
    }
  }}
>
  <slot>
    {languageTag() === "sv" ? "EN" : "SV"}
  </slot>
</a>
