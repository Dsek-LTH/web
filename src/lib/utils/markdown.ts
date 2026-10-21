import DOMPurify from "isomorphic-dompurify";
import { Marked } from "marked";
import type { RendererObject, Tokens } from "marked";

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

const SANITIZE_OPTIONS = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "target",
    "allow",
    "allowfullscreen",
    "frameborder",
    "referrerpolicy",
    "sandbox",
  ],
};

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const sanitize = (html: string) => DOMPurify.sanitize(html, SANITIZE_OPTIONS);

export type RenderMarkdownOptions = {
  inline?: boolean;
  renderer?: RendererObject;
};

/**
 * Renders markdown to HTML and sanitizes the result before it is injected with
 * `{@html}`. This is the only markdown-to-HTML path in the app.
 */
export const renderMarkdown = (
  markdown: string,
  { inline = false, renderer }: RenderMarkdownOptions = {},
): string => {
  const marked = renderer ? new Marked({ renderer }) : defaultMarked;
  const html = inline
    ? marked.parseInline(markdown, { async: false })
    : marked.parse(markdown, { async: false });

  return sanitize(html);
};

/** Renders a sanitized card excerpt without links or headings. */
export const renderMarkdownExcerpt = (markdown: string): string =>
  sanitize(excerptMarked.parse(markdown, { async: false }));
