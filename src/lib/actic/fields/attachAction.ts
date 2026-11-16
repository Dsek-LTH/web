/**
 * Bridges dnd-kit's attachment functions to a Svelte `use:` action.
 *
 * The `{@attach ...}` directive is the modern equivalent, but the repo's
 * prettier-plugin-svelte version can't parse it yet, so we use an action to
 * keep `pnpm format` working.
 *
 * Passing `null` detaches the node. Detached rows are not registered with
 * dnd-kit at all — neither draggable nor drop targets — without any DOM
 * change, so inputs inside keep their state and focus.
 */
export function attachAction(
  node: HTMLElement,
  attach: ((node: HTMLElement) => () => void) | null,
) {
  let cleanup = attach?.(node);
  return {
    update(next: ((node: HTMLElement) => () => void) | null) {
      cleanup?.();
      cleanup = next?.(node);
    },
    destroy: () => cleanup?.(),
  };
}
