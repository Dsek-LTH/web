/**
 * Typst-flavoured textarea commands. The generic mechanics (toggle wrapping,
 * per-line prefixes, insert-with-history) are shared with the Markdown editor
 * in `$lib/components/textareacommands`.
 */
import {
  insertText,
  toggleWrap,
  toggleForEachLine,
  getLineStart,
  getLineEnd,
} from "$lib/components/textareacommands";

export function toggleBold(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "*", "*");
}

export function toggleItalic(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "_", "_");
}

export function toggleBullet(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, /^- /, "- ");
}

export function toggleNumbered(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, /^\+ /, "+ ");
}

/** Cycle the heading level at the caret: none → `=` → `==` → `===` → none. */
export function cycleHeading(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;
  const selectionStart = textarea.selectionStart;
  const lineStart = getLineStart(textarea.value, selectionStart);
  const lineEnd = getLineEnd(textarea.value, textarea.selectionEnd);
  const line = textarea.value.substring(lineStart, lineEnd);

  const match = line.match(/^(=*)(\s?)/);
  const level = match?.at(1)?.length ?? 0;
  const space = match?.at(2)?.length ?? 0;
  const newLevel = (level + 1) % 4;
  const prefix = newLevel ? "=".repeat(newLevel) + " " : "";

  textarea.setSelectionRange(lineStart, lineStart + level + space);
  insertText(textarea, prefix);
  const sel = selectionStart + prefix.length - (level + space);
  textarea.setSelectionRange(sel, sel);
}

/** Insert a Typst link, selecting the URL placeholder: `#link("url")[text]`. */
export function insertLink(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;
  const start = textarea.selectionStart;
  const text =
    textarea.value.substring(start, textarea.selectionEnd) || "länktext";
  const snippet = `#link("url")[${text}]`;
  insertText(textarea, snippet);
  const urlStart = start + '#link("'.length;
  textarea.setSelectionRange(urlStart, urlStart + 3);
}

export function toggleInlineCode(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "`", "`");
}

export function toggleCodeBlock(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;
  textarea.setSelectionRange(
    getLineStart(textarea.value, textarea.selectionStart),
    getLineEnd(textarea.value, textarea.selectionEnd),
  );
  toggleWrap(textarea, "```\n", "\n```");
}

export function toggleStrike(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "#strike[", "]");
}

/** Insert a 2×2 Typst table skeleton. */
export function insertTable(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;
  insertText(textarea, "#table(\n  columns: 2,\n  [a], [b],\n  [c], [d],\n)");
}

/** Insert a horizontal line (`#line()`). */
export function insertLine(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;
  insertText(textarea, "\n#line(width: 100%)\n");
}

// --- active-state detection (for toggle buttons) ---------------------------

export function isWrapped(
  textarea: HTMLTextAreaElement | null,
  before: string,
  after: string,
): boolean {
  if (!textarea) return false;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  return (
    textarea.value.substring(start - before.length, start) === before &&
    textarea.value.substring(end, end + after.length) === after
  );
}

export function lineHasPrefix(
  textarea: HTMLTextAreaElement | null,
  prefix: string,
): boolean {
  if (!textarea) return false;
  const lineStart = getLineStart(textarea.value, textarea.selectionStart);
  return textarea.value.startsWith(prefix, lineStart);
}

export function lineHasHeading(textarea: HTMLTextAreaElement | null): boolean {
  if (!textarea) return false;
  const lineStart = getLineStart(textarea.value, textarea.selectionStart);
  return /^=+ /.test(textarea.value.substring(lineStart));
}
