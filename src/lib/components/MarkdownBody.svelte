<script lang="ts">
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
  <!-- The article body is sanitized server-side. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html marked(body)}
</section>
