<script lang="ts">
  import { renderMarkdown } from "$lib/utils/markdown";
  import { twMerge } from "tailwind-merge";

  let {
    body,
    class: klass,
    preview = false,
  }: { body: string; class?: string; preview?: boolean } = $props();

  const html = $derived(renderMarkdown(body, { preview }));
</script>

<section
  class={twMerge(
    "prose dark:prose-invert prose-invert-a:text-rosa-background prose-a:text-rosa-background prose-a:no-underline [&_a:hover]:underline",
    klass,
  )}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized by renderMarkdown -->
  {@html html}
</section>
