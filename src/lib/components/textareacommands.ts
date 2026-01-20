function insertText(textarea: HTMLTextAreaElement, text: string) {
  textarea.focus();
  // the only way to preserve edit history is to use these deprecated methods
  if (
    document.queryCommandSupported("insertText") &&
    document.execCommand("insertText", false, text)
  ) {
    return;
  }

  // fallback that does not preserve edit history
  textarea.value =
    textarea.value.substring(0, textarea.selectionStart) +
    text +
    textarea.value.substring(textarea.selectionEnd);
}

function toggleWrap(
  textarea: HTMLTextAreaElement | null,
  before: string,
  after: string,
) {
  if (textarea == null) return;
  const start = textarea.selectionStart,
    end = textarea.selectionEnd,
    selection = textarea.value.substring(start, end);

  const pre = textarea.value.substring(start - before.length, start);
  const post = textarea.value.substring(end, end + after.length);

  if (pre === before && post === after) {
    // remove wrapping
    textarea.setSelectionRange(start - before.length, end + after.length);
    insertText(textarea, selection);
    textarea.setSelectionRange(start - before.length, end - before.length);
    return;
  }

  insertText(textarea, before + selection + after);
  textarea.setSelectionRange(start + before.length, end + before.length);
}

function getLineStart(text: string, index: Number) {
  return text.substring(0, index).lastIndexOf("\n") + 1;
}

function getLineEnd(text: string, index: Number) {
  const lineEndOffset = text.substring(index).indexOf("\n");

  return lineEndOffset == -1 ? text.length : index + lineEndOffset;
}

export function toggleItalic(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "_", "_");
}

export function toggleBold(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "**", "**");
}

export function toggleStrikethrough(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "~~", "~~");
}

export function cycleHeader(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;

  const selectionStart = textarea.selectionStart;
  const lineStart = getLineStart(textarea.value, selectionStart);
  const lineEnd = getLineEnd(textarea.value, textarea.selectionEnd);
  const line = textarea.value.substring(lineStart, lineEnd);

  const headerMatch = line.match(/^(#{0,6})(\s|$)/);
  const headerCount = headerMatch?.at(1)?.length ?? 0;
  const space = headerMatch?.at(2)?.length ?? 0;
  const newCount = (headerCount + 1) % 7;
  const diff = newCount - headerCount + (newCount ? 1 : 0) - space;
  textarea.setSelectionRange(lineStart, lineStart + headerCount + space);
  insertText(textarea, "".padEnd(newCount, "#") + (newCount ? " " : ""));

  const sel = selectionStart + diff;
  textarea.setSelectionRange(sel, sel);
}
