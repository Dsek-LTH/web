<script lang="ts">
  import { marked } from "marked";
  import { twMerge } from "tailwind-merge";

  let { body, class: klass }: { body: string; class?: string } = $props();
</script>

<section
  class={twMerge(
    "prose dark:prose-invert prose-invert-a:text-rosa-background prose-a:text-rosa-background prose-a:no-underline **:hover:prose-a:underline",
    klass,
  )}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
  {@html marked(body)}
</section>
