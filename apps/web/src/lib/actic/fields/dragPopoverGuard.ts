let installed = false;

/**
 * Reopens a dragged element's popover after a keyed `{#each}` moves its node.
 *
 * Chrome closes a popover when its element moves in the document. In this drag
 * path the close is silent (no `beforetoggle`), so dnd-kit's recovery handler
 * does not run. Mutation observers run after the move but before the next
 * paint, allowing the element to stay in the top layer without changing the
 * application's live reorder behavior.
 */
export function installDragPopoverGuard() {
  if (installed) return;
  installed = true;

  const observer = new MutationObserver(() => {
    for (const element of document.querySelectorAll<HTMLElement>(
      "[data-dnd-dragging][popover]",
    )) {
      try {
        if (
          typeof element.showPopover === "function" &&
          element.isConnected &&
          !element.matches(":popover-open")
        ) {
          element.showPopover();
        }
      } catch {
        // Older browsers can reject the selector; match dnd-kit's best effort.
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
