<script lang="ts">
  /**
   * Groups multiple keyboard keys together to display combinations and shortcuts.
   *
   * @example
   * <KbdGroup>
   *   <Kbd symbol="Ctrl" trigger="Control" />
   *   <span>+</span>
   *   <Kbd symbol="Shift" trigger="Shift" />
   *   <span>+</span>
   *   <Kbd symbol="A" caseInsensitive />
   * </KbdGroup>
   */

  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<kbd
  bind:this={ref}
  data-slot="kbd-group"
  class={cn("inline-flex items-center gap-1", className)}
  {...restProps}
>
  {@render children?.()}
</kbd>
