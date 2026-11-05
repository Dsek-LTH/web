<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { twMerge } from "tailwind-merge";
  import { getContrastingTextColor } from "./ui/badge/badge.svelte";

  let {
    tag = undefined,
    class: klass,
  }: {
    tag: Pick<ExtendedPrismaModel<"Tag">, "color" | "name"> | undefined;
    class?: string;
  } = $props();

  // Solid fill in the tag's own color, with black or white text picked for contrast.
  // The inset ring keeps pale colors from dissolving into a white page or a bright photo.
  const style = $derived(
    tag?.color
      ? `background-color: ${tag.color}; color: ${getContrastingTextColor(tag.color)};`
      : undefined,
  );
</script>

<!-- The one tag style used everywhere (news, events, tag admin, selectors, card overlays). -->
{#if tag}
  <span
    class={twMerge(
      "inline-flex h-5 max-w-40 shrink-0 items-center rounded-full px-2 text-[11px] leading-none font-medium whitespace-nowrap ring-1 ring-black/10 ring-inset dark:ring-white/15",
      !tag.color && "bg-muted text-foreground",
      klass,
    )}
    {style}
  >
    <span class="truncate">{tag.name}</span>
  </span>
{/if}
