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

function toggleForEachLine(
  textarea: HTMLTextAreaElement | null,
  rule: RegExp,
  prefix: string,
) {
  if (textarea === null) return;

  const start = getLineStart(textarea.value, textarea.selectionStart);
  const end = getLineEnd(textarea.value, textarea.selectionEnd);
  textarea.setSelectionRange(start, end);

  const lines = textarea.value.substring(start, end).split("\n");

  if (lines.every((l) => l.match(rule))) {
    const removedPrefix = lines
      .map((l) => l.substring(l.match(rule)?.[0].length ?? 0))
      .join("\n");
    insertText(textarea, removedPrefix);
    textarea.setSelectionRange(start, start + removedPrefix.length);
    return;
  }

  const addedPrefix = lines.map((l) => prefix + l).join("\n");
  insertText(textarea, addedPrefix);
  textarea.setSelectionRange(start, start + addedPrefix.length);
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

export function toggleInlineCode(textarea: HTMLTextAreaElement | null) {
  toggleWrap(textarea, "`", "`");
}

// not perfect by any means, but a better implementation would require parsing the entire text area
export function toggleFencedCode(textarea: HTMLTextAreaElement | null) {
  textarea?.setSelectionRange(
    getLineStart(textarea.value, textarea.selectionStart),
    getLineEnd(textarea.value, textarea.selectionEnd),
  );
  toggleWrap(textarea, "```\n", "\n```");
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

export function insertLink(
  textarea: HTMLTextAreaElement | null,
  isImage?: boolean,
) {
  if (textarea === null) return;
  isImage ??= false;
  const start = textarea.selectionStart;
  const selection =
    textarea.value.substring(start, textarea.selectionEnd) ||
    (isImage ? "Alt text describing the image" : "link text");
  const linkTxt = (isImage ? "![" : "[") + selection + "](url)";
  insertText(textarea, linkTxt);
  textarea.setSelectionRange(
    start + linkTxt.length - 4,
    start + linkTxt.length - 1,
  );
}

export function insertImage(textarea: HTMLTextAreaElement | null) {
  insertLink(textarea, true);
}

export function insertTable(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;

  const start = getLineStart(textarea.value, textarea.selectionStart);
  const end = getLineEnd(textarea.value, textarea.selectionStart);
  const line = textarea.value.substring(start, end);
  const table = `| Header | Header |
| ------ | ------ |
| Cell | Cell |
| Cell | Cell |`;

  if (line.match(/^\s*$/) != null) {
    // empty (enough), replace
    textarea.setSelectionRange(start, end);
    insertText(textarea, table);
    return;
  }

  // append
  textarea.setSelectionRange(end, end);
  insertText(textarea, "\n" + table);
}

export function toggleQuote(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, />\s?/, "> ");
}

export function toggleSeparator(textarea: HTMLTextAreaElement | null) {
  if (textarea === null) return;

  const start = getLineStart(textarea.value, textarea.selectionStart);
  const end = getLineEnd(textarea.value, textarea.selectionStart);
  const line = textarea.value.substring(start, end);

  if (line.match(/\s{0,3}\*\s*\*\s*\*[*\s]*/)) {
    // lmao that regex is ugly, but it checks for a separator
    textarea.setSelectionRange(start, end);
    insertText(textarea, "");
    return;
  }

  if (line.match(/^\s*$/)) {
    textarea.setSelectionRange(start, end);
    insertText(textarea, "***");
  } else {
    textarea.setSelectionRange(end, end);
    insertText(textarea, "\n***");
  }
}

export function toggleUList(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, /-\s/, "- ");
}

export function toggleOList(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, /\d{1,9}\.\s/, "1. ");
}

export function toggleTaskList(textarea: HTMLTextAreaElement | null) {
  toggleForEachLine(textarea, /-\s\[[xX ]]\s/, "- [ ] ");
}
