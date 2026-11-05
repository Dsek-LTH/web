<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import { Badge } from "./ui/badge";

  let {
    tag = undefined,
    class: klass,
  }: {
    // Go's Tag shape; `null` color too, for the tag editor's live preview.
    tag: { color?: string | null; name: string } | undefined;
    class?: string;
  } = $props();
</script>

{#if tag}
  <Badge
    class={twMerge(
      "relative cursor-pointer overflow-hidden border-[var(--tag-color)] bg-[var(--tag-color)] text-xs whitespace-nowrap before:absolute before:inset-0 before:opacity-10 before:content-['']",
      klass,
    )}
    color={tag.color ?? undefined}
    style="--tag-color: {tag.color || 'var(--bc)'}"
  >
    {tag.name}
  </Badge>
{/if}
