import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * Toggle `pre`/`post` around each selection range — the CodeMirror twin of
 * `toggleWrap` in `textareacommands.ts`. If every range is already wrapped,
 * the markers are removed instead (history-preserving via a single dispatch).
 */
export function toggleWrapAround(
  view: EditorView,
  pre: string,
  post: string,
): void {
  const doc = view.state.doc;
  const tr = view.state.changeByRange((range) => {
    const text = view.state.sliceDoc(range.from, range.to);
    const before = view.state.sliceDoc(
      Math.max(0, range.from - pre.length),
      range.from,
    );
    const after = view.state.sliceDoc(
      range.to,
      Math.min(doc.length, range.to + post.length),
    );

    if (before === pre && after === post) {
      // Already wrapped: unwrap and leave the selection on the inner text.
      return {
        changes: {
          from: range.from - pre.length,
          to: range.to + post.length,
          insert: text,
        },
        range: EditorSelection.range(
          range.from - pre.length,
          range.to - pre.length,
        ),
      };
    }

    // Wrap: keep the selection on the inner text so toggling back works.
    return {
      changes: { from: range.from, to: range.to, insert: pre + text + post },
      range: EditorSelection.range(
        range.from + pre.length,
        range.from + pre.length + text.length,
      ),
    };
  });
  view.dispatch(tr);
}
