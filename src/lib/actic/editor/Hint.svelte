<script lang="ts">
  /**
   * A tooltip for any control: renders its children inside the trigger span
   * (which receives hover even when the wrapped button is disabled — a
   * disabled button itself never does) and shows the label, an optional
   * description and optional kbd shortcut chips. `ToolbarButton` builds on
   * this; use it directly for controls it doesn't own (popover and menu
   * triggers, links).
   */
  import type { Snippet } from "svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { Kbd } from "$lib/components/ui/kbd";
  import { cn } from "$lib/utils.js";
  import { shortcutKeys } from "./shortcuts.svelte";

  let {
    label,
    description,
    shortcut,
    class: cls,
    children,
  }: {
    /** The tooltip's heading (and the wrapped control's accessible name). */
    label: string;
    /** Optional second line: what the control does, disabled reasons, … */
    description?: string;
    /** CodeMirror-style "Mod-Shift-F"; rendered as kbd chips (⌘/⇧ on macOS). */
    shortcut?: string;
    /** Extra classes for the trigger span (e.g. the wrap underline). */
    class?: string;
    children?: Snippet;
  } = $props();

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <span {...props} class={cn("flex items-center", cls)}>
          {@render children?.()}
        </span>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <span class="flex flex-col">
        <span>{label}</span>
        {#if description}
          <span class="text-background/70 max-w-xs">{description}</span>
        {/if}
      </span>
      {#if shortcut}
        <span class="flex items-center gap-0.5">
          {#each shortcutKeys(shortcut, isMac) as key (key.symbol)}
            <Kbd symbol={key.symbol} trigger={key.trigger} caseInsensitive />
          {/each}
        </span>
      {/if}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
