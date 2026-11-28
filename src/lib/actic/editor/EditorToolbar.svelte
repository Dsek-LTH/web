<script lang="ts">
  /**
   * The Actic editors' shared toolbar bar: the title, the leading group
   * (the editor's own buttons, or page-specific controls before them), the
   * trailing group (page-specific controls after the editor's buttons), and
   * the divider that appears when the title truncates or the bar overflows
   * (the trailing group no longer has room to sit apart from the rest).
   */
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";

  let {
    title,
    leading,
    trailing,
    sticky = false,
    scroll = false,
    class: cls,
  }: {
    title?: string;
    /** Controls after the title and before the trailing group. */
    leading?: Snippet;
    /** Page-specific controls, pushed to the right of the bar. */
    trailing?: Snippet;
    /** Stick to the top of the viewport while scrolling. */
    sticky?: boolean;
    /** Scroll horizontally instead of clipping. */
    scroll?: boolean;
    class?: string;
  } = $props();

  let bar = $state<HTMLDivElement | null>(null);
  let titleEl = $state<HTMLSpanElement | null>(null);
  /**
   * True when the title is clipped or the bar overflows. In either case the
   * trailing group has lost its separate space, so a divider is shown to keep
   * it visually distinct from the leading group.
   */
  let collapsed = $state(false);

  $effect(() => {
    const el = bar;
    if (!el) return;
    const check = () => {
      const t = titleEl;
      collapsed =
        el.scrollWidth > el.clientWidth + 1 ||
        (t !== null && t.scrollWidth > t.clientWidth + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (titleEl) observer.observe(titleEl);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={bar}
  class={cn(
    "bg-muted-background text-muted-foreground flex h-11 shrink-0 items-center gap-0.5 border-b px-[7px]",
    sticky && "sticky top-(--actic-sticky-top,4rem) z-10",
    scroll && "no-scrollbar overflow-x-auto",
    cls,
  )}
>
  {#if title}
    <div class="min-w-0 flex-1">
      <span
        bind:this={titleEl}
        class="text-foreground block truncate pr-4 pl-[7px] text-sm font-medium"
      >
        {title}
      </span>
    </div>
  {/if}
  {#if leading}{@render leading()}{/if}
  {#if trailing}
    <div class="ml-auto flex items-center gap-0.5">
      <div
        class="border-border mx-1 h-5 shrink-0 border-l"
        class:hidden={!collapsed}
        aria-hidden="true"
      ></div>
      {@render trailing()}
    </div>
  {/if}
</div>
