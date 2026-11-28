<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  import TooltipPortal from "./tooltip-portal.svelte";
  import type { ComponentProps } from "svelte";
  import type { WithoutChildrenOrChild } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 0,
    side = "top",
    children,
    portalProps,
    ...restProps
  }: TooltipPrimitive.ContentProps & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
  } = $props();
</script>

<TooltipPortal {...portalProps}>
  <TooltipPrimitive.Content
    bind:ref
    data-slot="tooltip-content"
    {sideOffset}
    {side}
    class={cn(
      "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-foreground text-background z-50 inline-flex w-fit max-w-xs origin-(--bits-tooltip-content-transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
    <TooltipPrimitive.Arrow>
      {#snippet child({ props })}
        <!-- A plain down-pointing triangle. bits-ui's inline styles pin it to
             the box edge and flip it per side (translateY(100%) for top,
             rotate(180°) about the edge for bottom, ±90° for left/right) —
             that contract only works for an unrotated shape, which is why
             the old rotate-45 diamond wandered off-centre when flipped and
             poked into the kbd chips. It renders behind the content's
             children, so even when a shifted tooltip overlaps toolbar icons
             the arrow can't paint over them. -->
        <svg
          {...props}
          class="fill-foreground z-0"
          width="14"
          height="7"
          viewBox="0 0 14 7"
        >
          <path d="M0 0 L7 7 L14 0 Z" />
        </svg>
      {/snippet}
    </TooltipPrimitive.Arrow>
  </TooltipPrimitive.Content>
</TooltipPortal>
