<script lang="ts">
  import type { Tag } from "@prisma/client";
  import { twMerge } from "tailwind-merge";

  interface Props {
    tag?: Pick<Tag, "color" | "name"> | undefined;
    class?: string;
  }

  let { tag = undefined, class: clazz = "" }: Props = $props();
</script>

{#if tag}
  <span
    class={twMerge(
      "badge badge-md relative cursor-pointer overflow-hidden whitespace-nowrap border-[--tag-color] text-xs before:absolute before:inset-0 before:bg-[--tag-color] before:opacity-10 before:content-['']",
      clazz,
    )}
    style="--tag-color: {tag.color || 'var(--bc)'}"
  >
    {tag.name}
  </span>
{/if}
