import { Marked } from "marked";
import type { RendererObject, Tokens } from "marked";
import { sanitizeHtml } from "./sanitize";

const defaultMarked = new Marked();

const excerptRenderer: RendererObject = {
  // Links and headings are noise in card excerpts, where the whole card is a link.
  link(token: Tokens.Link): string {
    const text: string = this.parser.parseInline(token.tokens);

    return `<span>${text}</span>`;
  },
  heading(token: Tokens.Heading): string {
    const text: string = this.parser.parseInline(token.tokens);

    return `<span>${text}</span>`;
  },
};

const excerptMarked = new Marked({ renderer: excerptRenderer });

export type RenderMarkdownOptions = {
  inline?: boolean;
};

/**
 * Renders markdown to HTML and sanitizes the result before it is injected with
 * `{@html}`. This is the only markdown-to-HTML path in the app.
 */
export const renderMarkdown = (
  markdown: string,
  { inline = false }: RenderMarkdownOptions = {},
): string => {
  const html = inline
    ? defaultMarked.parseInline(markdown, { async: false })
    : defaultMarked.parse(markdown, { async: false });

  return sanitizeHtml(html);
};

/** Renders a sanitized card excerpt without links, headings, or media. */
export const renderMarkdownExcerpt = (markdown: string): string =>
  sanitizeHtml(excerptMarked.parse(markdown, { async: false }), {
    forbidTags: ["iframe", "video", "audio"],
  });
