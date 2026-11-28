/**
 * Keyboard shortcuts shared by the Actic editing sessions (Ctrl/Cmd, macOS
 * uses Cmd): plain S saves the draft, Shift+S downloads the PDF. Extracted
 * as a pure decision so the Shift+S case is testable — the trap it guards
 * against is S alone matching `key.toLowerCase() === "s"` with Shift held,
 * which would make the download shortcut unreachable.
 */
export function documentShortcut(
  e: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "key">,
): "save" | "download-pdf" | "compile" | null {
  if (!(e.ctrlKey || e.metaKey)) return null;
  if (e.key === "Enter") return "compile";
  if (e.key.toLowerCase() !== "s") return null;
  return e.shiftKey ? "download-pdf" : "save";
}

/** Wire the document shortcuts to a session's actions for the page's lifetime. */
export function documentShortcutsEffect(options: {
  save: () => void;
  downloadPdf: () => void;
  compile: () => void;
}): void {
  $effect(() => {
    const onKey = (e: KeyboardEvent) => {
      const shortcut = documentShortcut(e);
      if (!shortcut) return;
      e.preventDefault();
      if (shortcut === "download-pdf") options.downloadPdf();
      else if (shortcut === "compile") options.compile();
      else options.save();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

/** One kbd chip in a tooltip: what to draw and which physical key highlights it. */
export type ShortcutKey = { symbol: string; trigger: string };

/**
 * Split a CodeMirror-style shortcut ("Mod-Shift-F") into kbd chips for a
 * tooltip — platform-aware: ⌘/⇧ glyphs on macOS, spelled-out keys elsewhere.
 * `trigger` is the `KeyboardEvent.key` the chip highlights on (see Kbd).
 */
export function shortcutKeys(shortcut: string, isMac: boolean): ShortcutKey[] {
  const mod = isMac
    ? { symbol: "⌘", trigger: "Meta" }
    : { symbol: "Ctrl", trigger: "Control" };
  const shift = isMac
    ? { symbol: "⇧", trigger: "Shift" }
    : { symbol: "Shift", trigger: "Shift" };
  return shortcut.split("-").map((part) => {
    if (part === "Mod") return mod;
    if (part === "Shift") return shift;
    if (part === "Enter") return { symbol: "Enter", trigger: "Enter" };
    return { symbol: part.toUpperCase(), trigger: part.toUpperCase() };
  });
}
