<script lang="ts">
  import { tick } from "svelte";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import SortableItem from "$lib/actic/SortableItem.svelte";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import type { Snippet } from "svelte";

  /** What the row snippets get, per row. */
  export type RowHelpers = {
    /** Action registering the row's input — `use:trackInput={rowId}`. */
    trackInput: (node: HTMLElement, id: string) => { destroy: () => void };
    oninput: () => void;
    onenter: () => void;
    onescape: () => void;
    onblur: () => void;
  };

  let {
    ids,
    group,
    type,
    isFilled,
    addRow,
    removeRow,
    canDrag,
    class: className = "",
    onreorder,
    children: renderRow,
  }: {
    /** The row ids in current order, including the trailing free row. */
    ids: string[];
    group: string;
    type: string;
    /** Whether a row holds content (the free row doesn't). */
    isFilled: (id: string) => boolean;
    /**
     * Creates a row (after `afterId`, or at the end) and returns its id —
     * the parent owns the array, RowsBox owns the semantics.
     */
    addRow: (afterId?: string) => string;
    removeRow: (id: string) => void;
    /** Rows that may not be dragged (e.g. the trailing free row). */
    canDrag?: (id: string) => boolean;
    class?: string;
    /**
     * Called when a drag moves a row: `sourceId` should be re-inserted at
     * `slot` (how many remaining rows the pointer has passed the middle of).
     */
    onreorder: (sourceId: string, slot: number) => void;
    children: Snippet<
      [
        {
          handle: (node: HTMLElement) => () => void;
          isDragging: boolean;
          index: number;
          helpers: RowHelpers;
        }
      ]
    >;
  } = $props();

  let box: HTMLDivElement | undefined = $state();
  /** The last applied slot in the current drag, for hysteresis. */
  let lastSlot: string | null = null;
  /** The underlying input of each row, by row id. */
  let inputs: Record<string, HTMLInputElement | HTMLTextAreaElement | null> = {};

  function trackInput(node: HTMLElement, id: string) {
    inputs[id] = node.querySelector("input, textarea");
    return {
      destroy() {
        delete inputs[id];
      },
    };
  }
  function focus(id?: string) {
    if (id) inputs[id]?.focus();
  }

  // --- shared row behavior ---------------------------------------------------

  /** A filled trailing row grows a new free row after it. */
  function handleInput(id: string) {
    if (isFilled(id) && ids[ids.length - 1] === id) addRow();
  }

  /** Enter adds a row directly below the current one and focuses it. */
  async function handleEnter(id: string) {
    if (!isFilled(id)) {
      focus(id);
      return;
    }
    const at = ids.indexOf(id) + 1;
    const next = ids[at];
    if (next && !isFilled(next)) {
      // A free box sits right below — use it instead of adding another.
      focus(next);
      return;
    }
    const fresh = addRow(id);
    await tick();
    focus(fresh);
  }

  /**
   * Escape on an empty mid-list row closes it and returns focus to the
   * previous one; the natural trailing free row stays put (it isn't the
   * result of Enter), so escape only refocuses upwards there.
   */
  async function handleEscape(id: string) {
    if (isFilled(id)) return;
    const at = ids.indexOf(id);
    const isLast = at === ids.length - 1;
    if (!isLast && ids.length > 1) removeRow(id);
    await tick();
    focus(ids[Math.max(0, at - 1)]);
  }

  /** An emptied row disappears once the user moves on. */
  function handleBlur(id: string) {
    // The trailing free row would just regrow, so removing it is a no-op.
    if (!isFilled(id) && ids.length > 1 && ids[ids.length - 1] !== id) {
      removeRow(id);
    }
  }

  /**
   * The drag slot is computed from the live DOM rects rather than dnd-kit's
   * collision target — the rows (and DOM) shift under the pointer while
   * dragging, so the rendered rows are the only stable source of truth.
   */
  function onDragMove(event: {
    operation: {
      source: { id: unknown } | null;
      position: { current: { y: number } };
    };
  }) {
    const sourceId = String(event.operation.source?.id ?? "");
    if (!event.operation.source || !box) return;
    const pointerY = event.operation.position.current.y;
    // The dragged row (fixed in the top layer) and dnd-kit's placeholder
    // clone don't count as rows the pointer can pass.
    const others = [...box.children].filter(
      (el) =>
        el.getAttribute("data-dnd-placeholder") === null &&
        el.getAttribute("data-id") !== sourceId,
    );
    const slot = others.filter((el) => {
      const rect = el.getBoundingClientRect();
      return (rect.top + rect.bottom) / 2 < pointerY;
    }).length;
    const key = `${sourceId}:${slot}`;
    if (key === lastSlot) return;
    lastSlot = key;
    onreorder(sourceId, slot);
  }
</script>

<!-- One shared box: tinted like the other fields, rows separated by dividing
     lines. The trailing free row lives in `ids` and is the affordance for
     adding more — no add button needed. -->
<div
  bind:this={box}
  class={`${FIELD_BG} flex flex-col rounded-md border ${className}`}
>
  <DragDropProvider
    onDragStart={() => (lastSlot = null)}
    {onDragMove}
    onDragEnd={() => (lastSlot = null)}
  >
    {#each ids as id, i (id)}
      <SortableItem
        {id}
        index={i}
        {group}
        {type}
        accept={type}
        disabled={canDrag ? !canDrag(id) : false}
      >
        {#snippet children({ handle, isDragging })}
          {@render renderRow({
            handle,
            isDragging,
            index: i,
            helpers: {
              trackInput,
              oninput: () => handleInput(id),
              onenter: () => handleEnter(id),
              onescape: () => handleEscape(id),
              onblur: () => handleBlur(id),
            },
          })}
        {/snippet}
      </SortableItem>
    {/each}
  </DragDropProvider>
</div>
