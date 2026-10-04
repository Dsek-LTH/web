/**
 * Bridges dnd-kit's attachment functions to a Svelte `use:` action.
 *
 * The `{@attach ...}` directive is the modern equivalent, but the repo's
 * prettier-plugin-svelte version can't parse it yet, so we use an action to
 * keep `pnpm format` working.
 */
export function attachAction(
  node: HTMLElement,
  attach: (node: HTMLElement) => () => void,
) {
  const cleanup = attach(node);
  return {
    destroy: cleanup,
  };
}
