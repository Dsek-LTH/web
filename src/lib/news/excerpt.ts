import { marked } from "marked";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

/**
 * Article bodies are Markdown/HTML; previews (cards, list rows) want one run of plain
 * text, so paragraphs, headings and line breaks flow together instead of stacking.
 * Long enough for any preview; callers clamp the visible lines with CSS.
 */
export const toExcerpt = (body: string, maxLength = 240) =>
  (marked.parse(body, { async: false }) as string)
    // Inline tags vanish without a trace, so "[link](…)." stays "link."; any other
    // tag (paragraphs, headings, lists, line breaks) separates words with a space.
    .replace(
      /<\/?(a|strong|em|b|i|u|s|del|code|span|sub|sup|mark)\b[^>]*>/g,
      "",
    )
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(amp|lt|gt|quot|#39|nbsp);/g,
      (_, e: string) => ENTITIES[e] ?? "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
