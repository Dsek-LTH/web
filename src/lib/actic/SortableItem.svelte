<script lang="ts">
  import { createSortable } from "@dnd-kit/svelte/sortable";
  import { attachAction } from "$lib/actic/attachAction";
  import type { Snippet } from "svelte";

  let {
    id,
    index,
    group = "default",
    children,
  }: {
    id: string;
    index: number;
    group?: string;
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
  });
</script>

<div use:attachAction={sortable.attach}>
  {@render children?.({
    handle: sortable.attachHandle,
    isDragging: sortable.isDragging,
  })}
</div>
