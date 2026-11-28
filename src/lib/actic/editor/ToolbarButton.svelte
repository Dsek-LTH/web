<script lang="ts">
  /**
   * The Actic toolbars' shared icon button: a tooltip that keeps working
   * while the button is disabled (via `Hint` — the trigger rides a wrapper
   * span, since a disabled button never receives hover), with an optional
   * description line, kbd shortcut chips and the wrap toggle's underline.
   *
   * Extra native button attributes are spread onto the `<button>`, so the
   * component also works as a popover/menu trigger (bits-ui's `child`
   * props land on the real button, not the tooltip's wrapper span).
   */
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";
  import Hint from "./Hint.svelte";

  type ToolbarButtonProps = Omit<
    HTMLButtonAttributes,
    "children" | "class" | "onclick"
  > & {
    /** Tooltip heading and aria-label. */
    label: string;
    /** Optional second line in the tooltip (what it does, why disabled). */
    description?: string;
    /** CodeMirror-style "Mod-Shift-F"; rendered as kbd chips (⌘/⇧ on macOS). */
    shortcut?: string;
    disabled?: boolean;
    /** On-state; with `underline` it shows the bar, otherwise it's inert
     * (the icons stay muted — state affordances live elsewhere). */
    active?: boolean;
    /** Set for toggles so assistive tech sees the state. */
    pressed?: boolean;
    /** A small pink underline flush with the bar's bottom edge while active. */
    underline?: boolean;
    onclick?: (event: MouseEvent) => void;
    class?: string;
    children?: Snippet;
  };

  let {
    label,
    description,
    shortcut,
    disabled = false,
    active = false,
    pressed,
    underline = false,
    onclick,
    class: cls,
    children,
    ...rest
  }: ToolbarButtonProps = $props();
</script>

<Hint
  {label}
  {description}
  {shortcut}
  class={cn(
    // Keep the span at the button's own height so the tooltip anchors right
    // next to the icon — and so the wrap toggle's tooltip doesn't float
    // higher than its neighbours. The underline variant hangs below the
    // button instead: (bar 44px − button 30px) / 2 = 7px to the bar edge.
    "relative items-center",
    underline &&
      active &&
      // 2px tall with the navbar underline's rounding, lifted 0.5px off the
      // bar's edge so it doesn't touch it.
      "after:bg-rosa-400 after:absolute after:inset-x-1 after:-bottom-[6px] after:h-[2px] after:rounded-[2px] after:content-['']",
  )}
>
  <button
    {...rest}
    type="button"
    {disabled}
    aria-label={label}
    aria-pressed={pressed}
    {onclick}
    class={cn(
      "text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50",
      cls,
    )}
  >
    {@render children?.()}
  </button>
</Hint>
