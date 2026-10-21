<script lang="ts">
  import { renderMarkdown } from "$lib/utils/markdown";
  import { twMerge } from "tailwind-merge";

  let { body, class: klass }: { body: string; class?: string } = $props();
</script>

<section
  class={twMerge(
    "prose dark:prose-invert prose-invert-a:text-rosa-background prose-a:text-rosa-background prose-a:no-underline [&_a:hover]:underline",
    klass,
  )}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized by renderMarkdown -->
  {@html renderMarkdown(body)}
</section>
