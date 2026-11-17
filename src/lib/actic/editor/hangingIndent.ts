import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

/** The base left padding every line carries (see the chrome theme). */
const LINE_PADDING = 12;

/**
 * How far a line's wrapped continuations should be indented: the leading
 * whitespace plus, for list/enum items, the width of the marker (`- `, `+ `,
 * `/ `, `1. `, `100. `), so wrapped text lines up under the content instead
 * of under the line start. Tabs count as `tabSize` columns.
 */
export function hangingIndentOf(text: string, tabSize: number): number {
  const match = /^([ \t]*)(?:([-+/])[ \t]+|(\d{1,9}[.)])[ \t]+)?/.exec(text);
  if (!match) return 0;
  let columns = 0;
  for (const char of match[1] ?? "") {
    columns += char === "\t" ? tabSize : 1;
  }
  const marker = match[2] ?? match[3];
  if (marker) columns += marker.length + 1; // marker plus the space after it
  return columns;
}

function decorate(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const tabSize = view.state.tabSize;
  // `text-indent` moves only the line's first row; `padding-left` sets where
  // the wrapped rows land. The base padding is re-declared because the inline
  // style overrides the theme's shorthand.
  const decoration = (columns: number) =>
    Decoration.line({
      attributes: {
        style: `text-indent: -${columns}ch; padding-left: calc(${LINE_PADDING}px + ${columns}ch);`,
      },
    });

  for (const { from, to } of view.visibleRanges) {
    let position = from;
    while (position <= to) {
      const line = view.state.doc.lineAt(position);
      const columns = hangingIndentOf(line.text, tabSize);
      if (columns > 0) builder.add(line.from, line.from, decoration(columns));
      position = line.to + 1;
    }
  }
  return builder.finish();
}

/**
 * Hanging indentation for wrapped lines: continuations align with the
 * content's own column (indentation plus list-marker width). Purely visual —
 * on lines that don't wrap, the negative first-line indent and the padding
 * cancel out, so nothing moves.
 */
export function hangingIndent() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorate(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = decorate(update.view);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
