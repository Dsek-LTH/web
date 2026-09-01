<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import { Badge } from "./ui/badge";

  let {
    tag = undefined,
    class: klass,
  }: {
    // Matches the Go API's Tag shape - both consumers (TagSelector,
    // Article.svelte) are article-feature, Go-backed.
    tag: { color?: string; name: string } | undefined;
    class?: string;
  } = $props();
</script>

{#if tag}
  <Badge
    class={twMerge(
      "relative cursor-pointer overflow-hidden border-[var(--tag-color)] bg-[var(--tag-color)] text-xs whitespace-nowrap before:absolute before:inset-0 before:opacity-10 before:content-['']",
      klass,
    )}
    style="--tag-color: {tag.color || 'var(--bc)'}"
  >
    {tag.name}
  </Badge>
{/if}
