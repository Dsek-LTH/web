import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

/**
 * The language package completes Typst's built-ins but not its code keywords,
 * so this source offers `#set`, `#show` and friends right after the hash.
 */
const KEYWORDS = [
  "context",
  "continue",
  "else",
  "for",
  "if",
  "import",
  "include",
  "let",
  "return",
  "set",
  "show",
  "while",
];

export function typstKeywordCompletion(
  context: CompletionContext,
): CompletionResult | null {
  const before = context.matchBefore(/#[a-zA-Z]+/);
  if (!before) return null;
  return {
    from: before.from,
    options: KEYWORDS.map((keyword) => ({
      label: `#${keyword}`,
      type: "keyword",
    })),
    validFor: /^#[a-zA-Z]*$/,
  };
}
