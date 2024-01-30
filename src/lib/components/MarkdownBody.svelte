<script lang="ts">
  import DOMPurify from "isomorphic-dompurify";
  import { marked } from "marked";
  import { twMerge } from "tailwind-merge";

  let clazz: string = "";
  export { clazz as class };
  export let body: string;
</script>

<section
  class={twMerge(
    "prose-a prose prose-a:link prose-a:link-primary lg:prose-xl prose-a:no-underline",
    clazz,
  )}
>
  <slot />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
  {@html marked(DOMPurify.sanitize(body))}
</section>
