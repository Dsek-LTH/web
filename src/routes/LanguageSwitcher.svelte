<script lang="ts">
  import { getLocale, setLocale } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };

  const switchLocale = async () => {
    const next = getLocale() === "sv" ? "en" : "sv";
    // Persist to the member's account so the custom-userPreference strategy
    // (which takes priority over the cookie) doesn't snap back on next request.
    if ($page.data.user?.studentId) {
      await fetch("/api/language", {
        method: "POST",
        body: JSON.stringify({ language: next }),
      });
    }
    setLocale(next);
  };
</script>

<a
  class={twMerge("btn btn-ghost", clazz)}
  href={$page.url.pathname}
  hreflang={getLocale() === "sv" ? "en" : "sv"}
  on:click|preventDefault={switchLocale}
>
  <slot>
    {getLocale() === "sv" ? "EN" : "SV"}
  </slot>
</a>
