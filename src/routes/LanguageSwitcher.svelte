<script lang="ts">
  import { languageTag, onSetLanguageTag } from "$paraglide/runtime";
  import { page } from "$app/state";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import { twMerge } from "tailwind-merge";
  import { browser } from "$app/environment";

  interface Props {
    class?: string;
    children?: import("svelte").Snippet;
  }

  let { class: clazz = "", children }: Props = $props();

  if (browser) {
    onSetLanguageTag(() => {
      invalidateAll();
    });
  }
</script>

<a
  class={twMerge("btn btn-ghost", clazz)}
  href={i18n.route(page.url.pathname)}
  hreflang={languageTag() === "sv" ? "en" : "sv"}
>
  {#if children}{@render children()}{:else}
    {languageTag() === "sv" ? "EN" : "SV"}
  {/if}
</a>
