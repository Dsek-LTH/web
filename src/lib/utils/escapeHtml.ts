const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text so it can be safely interpolated into an `{@html}` string. */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
