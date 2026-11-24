import type { TypstFile } from "$lib/actic/typst/typst";

/**
 * The `/write` instant-render behaviour, shared by the write shell and the
 * diff page: watch a reactive source and keep the preview rendered from it —
 * trailing micro-delay that grows to 120ms after a slow render, with
 * in-flight coalescing so a typing burst never queues a backlog of compiles.
 * Must run where `$effect` is allowed (component init or an effect root).
 */
export function instantRenderEffect(options: {
  /** Reactive: what to compile next. */
  source: () => string;
  /** Reactive: files the compile needs (defaults to none). */
  files?: () => TypstFile[];
  render: (source: string, files: TypstFile[]) => Promise<void>;
}): void {
  let inFlight = false;
  let queued: string | null = null;
  let lastRenderMs = 0;

  $effect(() => {
    const current = options.source();
    const files = options.files?.() ?? [];
    if (!current) return;
    const delay = lastRenderMs > 200 ? 120 : 0;
    const timer = setTimeout(() => {
      if (inFlight) {
        queued = current;
        return;
      }
      void render(current, files);
    }, delay);
    return () => clearTimeout(timer);
  });

  async function render(current: string, files: TypstFile[]) {
    inFlight = true;
    const started = performance.now();
    try {
      await options.render(current, files);
    } finally {
      lastRenderMs = performance.now() - started;
      inFlight = false;
      if (queued !== null) {
        const next = queued;
        queued = null;
        void render(next, options.files?.() ?? []);
      }
    }
  }
}
