<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { twMerge } from "tailwind-merge";

  export let tag:
    | Pick<ExtendedPrismaModel<"Tag">, "color" | "name">
    | undefined = undefined;
  let clazz = "";
  export { clazz as class };
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
