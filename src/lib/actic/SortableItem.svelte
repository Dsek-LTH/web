<script lang="ts">
  import { createSortable } from "@dnd-kit/svelte/sortable";
  import { attachAction } from "$lib/actic/attachAction";
  import type { Snippet } from "svelte";

  let {
    id,
    index,
    group = "default",
    type,
    accept,
    disabled = false,
    children,
  }: {
    id: string;
    index: number;
    group?: string;
    /** What kind of item this is, for `accept` matching. */
    type?: string;
    /** Which draggable types this item may be a drop target for. */
    accept?: string | string[];
    /** Detached items are neither draggable nor drop targets. */
    disabled?: boolean;
    children?: Snippet<
      [{ handle: (node: HTMLElement) => () => void; isDragging: boolean }]
    >;
  } = $props();

  const sortable = createSortable({
    get id() {
      return id;
    },
    get index() {
      return index;
    },
    get group() {
      return group;
    },
    get type() {
      return type;
    },
    get accept() {
      return accept;
    },
  });
</script>

<div use:attachAction={disabled ? null : sortable.attach} data-id={id}>
  {@render children?.({
    handle: sortable.attachHandle,
    isDragging: sortable.isDragging,
  })}
</div>
