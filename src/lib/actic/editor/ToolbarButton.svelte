<script lang="ts">
  /**
   * The Actic toolbars' shared icon button: a tooltip that keeps working
   * while the button is disabled (via `Hint` — the trigger rides a wrapper
   * span, since a disabled button never receives hover), with an optional
   * description line, kbd shortcut chips and the wrap toggle's underline.
   */
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";
  import Hint from "./Hint.svelte";

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
  }: {
    /** Tooltip heading and aria-label. */
    label: string;
    /** Optional second line in the tooltip (what it does, why disabled). */
    description?: string;
    /** CodeMirror-style "Mod-Shift-F"; rendered as kbd chips (⌘/⇧ on macOS). */
    shortcut?: string;
    disabled?: boolean;
    /** Toolbar-toggle highlight (text-foreground), e.g. the wrap toggle. */
    active?: boolean;
    /** Set for toggles so assistive tech sees the state. */
    pressed?: boolean;
    /** A small pink underline flush with the bar's bottom edge while active. */
    underline?: boolean;
    onclick?: () => void;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<Hint
  {label}
  {description}
  {shortcut}
  class={cn(
    "relative h-full items-center",
    underline &&
      active &&
      "after:bg-rosa-400 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:content-['']",
  )}
>
  <button
    type="button"
    {disabled}
    aria-label={label}
    aria-pressed={pressed}
    {onclick}
    class={cn(
      "text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50",
      active && "text-foreground",
      cls,
    )}
  >
    {@render children?.()}
  </button>
</Hint>
