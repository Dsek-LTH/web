/**
 * The sticky offset shared by the Actic toolbars: the site header's bottom
 * edge — unless the only `<header>` is a bottom nav (phones), where pinning
 * "under" it would throw the bar off-screen, and a missing header too, in
 * which case the bar pins to the viewport top.
 */
export function stickyTopFor(
  headerBottom: number | undefined,
  viewportHeight: number,
): number {
  return headerBottom !== undefined && headerBottom < viewportHeight / 2
    ? headerBottom
    : 0;
}

const BAR_HEIGHT = 44;

/**
 * Keep `--actic-sticky-top` (and the toolbars' `--actic-panel-top`) synced
 * to the header on `<html>`, so every bar on the page — source editor,
 * preview, CodeMirror panels — inherits the same offset. Returns a cleanup.
 */
export function watchStickyTop(): () => void {
  const header = document.querySelector("header");
  const sync = () => {
    const top = stickyTopFor(
      header?.getBoundingClientRect().bottom,
      window.innerHeight,
    );
    document.documentElement.style.setProperty(
      "--actic-sticky-top",
      `${top}px`,
    );
    document.documentElement.style.setProperty(
      "--actic-panel-top",
      `${top + BAR_HEIGHT}px`,
    );
  };
  sync();
  window.addEventListener("resize", sync);
  return () => window.removeEventListener("resize", sync);
}
