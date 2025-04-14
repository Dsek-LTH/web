<!-- @component
  This component takes a markdown string, buils a HTML page around
  the markdown content and finally renders it all in an iframe.
  It also includes all stylesheets from the parent document,
  so that the iframe looks the same as the parent document.
-->

<script lang="ts">
  import { browser, dev } from "$app/environment";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { marked } from "marked";
  import bioFrame from "./bio.html?raw";

  export let bio: string;

  $: theme = $page.data.theme;

  let stylesheets = "";
  let css = "";

  if (browser) {
    if (dev) {
      /**
       * In development, there are no external stylesheets to link to
       * so we extract the CSS from the style elements instead.
       */
      css = Array.from(document.styleSheets)
        .map(({ cssRules }) =>
          Array.from(cssRules)
            .map(({ cssText }) => cssText)
            .join("\n"),
        )
        .join("\n");
    } else {
      /** In production, we include all stylesheets with links. */
      stylesheets = Array.from(document.styleSheets)
        .map(({ href }) => `<link rel="stylesheet" href="${href}" />`)
        .join("\n");
    }
  }

  let iframeEl: HTMLIFrameElement;
  onMount(() => {
    function handleMessage(event: MessageEvent) {
      if (typeof event.data === "object" && "height" in event.data) {
        // Set the height of the iframe to the height of the content
        // It is initially set to 0 to avoid a flash of content.
        iframeEl.style.height = `${event.data.height ?? 0}px`;
      }
    }

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  });

  $: srcdoc = bioFrame
    .replace("%STYLESHEETS%", stylesheets)
    .replace("%CSS%", css)
    .replace("%BIO%", marked(bio) as string)
    .replace("%THEME%", theme);
</script>

<iframe
  title="Bio"
  sandbox="allow-top-navigation allow-scripts"
  class="max-h-80 w-full"
  style="height: 0;"
  {srcdoc}
  bind:this={iframeEl}
></iframe>
