import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";

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

/** The diff package's marker functions, offered on the diff page only. */
const MARKERS = ["add", "remove"];

/**
 * Completes the manual diff markers (`#add[` / `#remove[`), inserting the
 * brackets with the cursor between them. Only takes over from the keyword
 * source when the word could still become a marker — no keyword starts with
 * `a` or `r`, so nothing is shadowed.
 */
export function typstMarkerCompletion(
  context: CompletionContext,
): CompletionResult | null {
  const before = context.matchBefore(/#[a-zA-Z]+/);
  if (!before) return null;
  const word = before.text.slice(1).toLowerCase();
  if (!MARKERS.some((marker) => marker.startsWith(word))) return null;
  return {
    from: before.from,
    options: MARKERS.map((marker) => ({
      label: `#${marker}`,
      type: "keyword",
      apply: (view: EditorView, _completion, from, to) => {
        view.dispatch({
          changes: { from, to, insert: `#${marker}[]` },
          selection: { anchor: from + marker.length + 2 },
        });
      },
    })),
    validFor: /^#[a-zA-Z]*$/,
  };
}
