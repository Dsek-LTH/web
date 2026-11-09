<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import { Badge } from "./ui/badge";

  let {
    tag = undefined,
    class: klass,
  }: {
    tag: Pick<ExtendedPrismaModel<"Tag">, "color" | "name"> | undefined;
    class?: string;
  } = $props();
</script>

<!-- The one tag style used everywhere (news, events, tag admin, selectors, card overlays).
     Badge fills it with the tag's color and picks black or white text for contrast.
     The inset ring keeps pale colors from dissolving into a white page or a bright photo. -->
{#if tag}
  <Badge
    color={tag.color ?? undefined}
    variant="outline"
    class={cn(
      "h-5 max-w-40 py-0 text-[11px] leading-none ring-1 ring-black/10 ring-inset dark:ring-white/15",
      !tag.color && "bg-muted border-transparent",
      klass,
    )}
  >
    <span class="truncate">{tag.name}</span>
  </Badge>
{/if}
