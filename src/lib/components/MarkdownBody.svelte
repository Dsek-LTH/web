<script lang="ts">
  import { marked } from "marked";
  import { twMerge } from "tailwind-merge";

  interface Props {
    class?: string;
    body: string;
    children?: import("svelte").Snippet;
  }

  let { class: clazz = "", body, children }: Props = $props();
</script>

<section
  class={twMerge(
    "prose prose-a:link prose-a:link-primary prose-a:no-underline",
    clazz,
  )}
>
  {@render children?.()}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
  {@html marked(body)}
</section>
