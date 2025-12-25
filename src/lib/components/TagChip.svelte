<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { twMerge } from "tailwind-merge";
  import { Badge } from "./ui/badge";

  let {
    tag = undefined,
    class: klass,
  }: {
    tag: Pick<ExtendedPrismaModel<"Tag">, "color" | "name"> | undefined;
    class?: string;
  } = $props();
</script>

{#if tag}
  <Badge
    class={twMerge(
      "relative cursor-pointer overflow-hidden border-[--tag-color] text-xs whitespace-nowrap before:absolute before:inset-0 before:bg-[--tag-color] before:opacity-10 before:content-['']",
      klass,
    )}
    style="--tag-color: {tag.color || 'var(--bc)'}"
  >
    {tag.name}
  </Badge>
{/if}
