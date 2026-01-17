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

export function toggleItalic(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "_", "_");
}

export function toggleBold(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "**", "**");
}

export function toggleStrikethrough(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "~~", "~~");
}
