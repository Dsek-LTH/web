const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for interpolating into HTML, e.g. a file or member name
 * passed to a translation rendered with {@html}. */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => entities[c]!);
