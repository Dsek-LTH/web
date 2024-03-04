<script lang="ts">
  import DOMPurify from "isomorphic-dompurify";
  import { marked } from "marked";
  import { twMerge } from "tailwind-merge";

  export let bare = false;
  export let wrappedLink = false; // if body is wrapped in an anchor tag (has to be positioned absolute and inset-0)
  let clazz = "";
  export { clazz as class };
  export let body: string;
  $: mergedClass = (() => {
    if (bare) return clazz;
    let merged = twMerge(
      "prose prose-a:link-primary prose-a:no-underline",
      clazz,
    );
    if (wrappedLink) {
      merged = twMerge(
        "pointer-events-none relative prose-a:pointer-events-auto",
        merged,
      );
    }
    return merged;
  })();
</script>

<section class={mergedClass}>
  <slot />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
  {@html marked(DOMPurify.sanitize(body))}
</section>
