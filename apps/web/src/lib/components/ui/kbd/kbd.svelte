<script lang="ts">
  /**
   * A keyboard key visualizer that highlights when the corresponding physical key is pressed.
   * Supports multiple simultaneous highlights for key combinations and shortcuts.
   *
   * @prop {string} symbol - The visual string or icon rendered in the UI (e.g., "⌘").
   * @prop {string} [trigger] - The DOM `KeyboardEvent.key` to listen for. Defaults to `symbol`.
   * @prop {boolean} [caseInsensitive=false] - Whether to ignore case during matching. Defaults to `false`.
   *
   * @example
   * <Kbd symbol="⌘" trigger="Meta" />
   *
   * <Kbd symbol="B" />
   *
   * <Kbd symbol="B" caseInsensitive />
   */

  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    symbol,
    trigger,
    caseInsensitive = false,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    symbol: string;
    trigger?: string;
    caseInsensitive?: boolean;
  } = $props();

  const normalizeKey = (key: string) =>
    caseInsensitive ? key.toLowerCase() : key;

  let highlighted = $state(false);

  const rawTargetKey = $derived(trigger ?? symbol);
  const targetKey = $derived(normalizeKey(rawTargetKey));

  const onKeyDown = (e: KeyboardEvent) =>
    (highlighted = normalizeKey(e.key) === targetKey || highlighted);

  const onKeyUp = (e: KeyboardEvent) =>
    (highlighted = normalizeKey(e.key) !== targetKey && highlighted);

  const clearHighlight = () => (highlighted = false);

  $effect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearHighlight);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearHighlight);
    };
  });
</script>

<kbd
  bind:this={ref}
  data-slot="kbd"
  data-highlight={highlighted}
  class={cn(
    "bg-muted-background data-[highlight=true]:bg-rosa-background data-[highlight=true]:text-rosa-foreground data-[highlight=true]:border-rosa-background border-border text-semibold text-muted-foreground in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 pointer-events-none inline-flex min-h-4 min-w-4 items-center justify-center gap-1 rounded-xs border px-1 align-middle font-sans text-xs leading-none font-medium transition-colors select-none [&_svg:not([class*='size-'])]:size-3",
    className,
  )}
  {...restProps}
>
  {symbol}
</kbd>
