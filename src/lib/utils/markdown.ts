import { Marked } from "marked";
import type { RendererObject, Tokens } from "marked";
import { sanitizeHtml } from "./sanitize";

const defaultMarked = new Marked();

const stripLinksRenderer: RendererObject = {
  link(token: Tokens.Link): string {
    const text: string = this.parser.parseInline(token.tokens);

    return `<span>${text}</span>`;
  },
};

const previewMarked = new Marked({ renderer: stripLinksRenderer });

const excerptRenderer: RendererObject = {
  ...stripLinksRenderer,
  heading(token: Tokens.Heading): string {
    const text: string = this.parser.parseInline(token.tokens);

    return `<span>${text}</span>`;
  },
};

const excerptMarked = new Marked({ renderer: excerptRenderer });

export type RenderMarkdownOptions = {
  inline?: boolean;
  /** Keep the full article layout but render links as plain spans. */
  preview?: boolean;
};

/**
 * Renders markdown to HTML and sanitizes the result before it is injected with
 * `{@html}`. This is the only markdown-to-HTML path in the app.
 */
export const renderMarkdown = (
  markdown: string,
  { inline = false, preview = false }: RenderMarkdownOptions = {},
): string => {
  const marked = preview ? previewMarked : defaultMarked;
  const html = inline
    ? marked.parseInline(markdown, { async: false })
    : marked.parse(markdown, { async: false });

  return sanitizeHtml(html);
};

/** Renders a sanitized card excerpt without links or headings. */
export const renderMarkdownExcerpt = (markdown: string): string =>
  sanitizeHtml(excerptMarked.parse(markdown, { async: false }));
