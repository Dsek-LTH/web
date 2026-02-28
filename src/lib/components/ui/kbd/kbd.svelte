<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
  import { onMount } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    symbol,
    trigger,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    symbol: string;
    trigger?: string;
  } = $props();

  let highlighted = $state(false);
  const key = $derived(trigger ?? symbol.toLowerCase());

  const setHighlight = (e: KeyboardEvent) =>
    (highlighted = e.key === key || highlighted);
  const unsetHighlight = (e: KeyboardEvent) =>
    (highlighted = e.key !== key && highlighted);

  onMount(() => {
    window.addEventListener("keydown", setHighlight);
    window.addEventListener("keyup", unsetHighlight);

    return () => {
      window.removeEventListener("keydown", setHighlight);
      window.removeEventListener("keyup", unsetHighlight);
    };
  });
</script>

<kbd
  bind:this={ref}
  data-slot="kbd"
  class={cn(
    "bg-muted-background data-[highlight=true]:bg-rosa-background data-[highlight=true]:text-rosa-foreground data-[highlight=true]:border-rosa-background border-border text-semibold text-muted-foreground pointer-events-none inline-flex min-h-4 min-w-4 items-center justify-center gap-1 rounded-xs border px-1 align-middle font-sans text-xs leading-none font-medium transition-colors select-none",
    "[&_svg:not([class*='size-'])]:size-3",
    "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
    className,
  )}
  data-highlight={highlighted}
  {...restProps}
>
  {symbol}
</kbd>
