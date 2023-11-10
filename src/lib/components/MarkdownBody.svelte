<script lang="ts">
  import { marked } from "marked";

  let className: string = "";
  export { className as class };
  export let body: string;
</script>

<section class="prose-a prose lg:prose-xl prose-a:text-primary prose-a:no-underline {className}">
  <slot name="before-body" />
  <!-- The article body is sanitized server-side. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html marked(body)}
</section>
