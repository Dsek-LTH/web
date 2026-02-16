<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
    import { onMount } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    symbol,
    trigger,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & { symbol: string, trigger?: string } = $props();

    let highlighted = $state(false);
    const key = $derived(trigger ?? symbol.toLowerCase());

    const setHighlight = (e: KeyboardEvent) => highlighted = e.key === key || highlighted;
    const unsetHighlight = (e: KeyboardEvent) => highlighted = e.key !== key && highlighted;

  onMount(() => {
    window.addEventListener("keydown", setHighlight);
    window.addEventListener("keyup", unsetHighlight);
    
    return () => {
      window.removeEventListener("keydown", setHighlight);
      window.removeEventListener("keyup", unsetHighlight);
    };
  })
</script>

<kbd
  bind:this={ref}
  data-slot="kbd"
  class={cn(
    "bg-muted-background data-[highlight=true]:bg-rosa-background data-[highlight=true]:text-rosa-foreground data-[highlight=true]:border-rosa-background transition-colors border border-border text-semibold text-muted-foreground inline-flex h-4 w-4 min-h-16px min-w-16px items-center justify-center gap-1 rounded-xs px-1/2 font-sans text-xs font-medium select-none",
    "[&_svg:not([class*='size-'])]:size-3",
    "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
    className,
  )}
  data-highlight={highlighted}
  {...restProps}
>
    {symbol}
</kbd>
