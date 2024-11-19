<script lang="ts">
  import { languageTag, onSetLanguageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import { twMerge } from "tailwind-merge";
  import { browser } from "$app/environment";

  let clazz = "";
  export { clazz as class };

  if (browser) {
    onSetLanguageTag(() => {
      invalidateAll();
    });
  }
</script>

<a
  class={twMerge("btn btn-ghost", clazz)}
  href={i18n.route($page.url.pathname)}
  hreflang={languageTag() === "sv" ? "en" : "sv"}
>
  <slot>
    {languageTag() === "sv" ? "EN" : "SV"}
  </slot>
</a>
