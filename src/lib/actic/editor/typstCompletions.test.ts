import { expect, test } from "vitest";
import { EditorState } from "@codemirror/state";
import { type Completion, CompletionContext } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import {
  typstKeywordCompletion,
  typstMarkerCompletion,
} from "./typstCompletions";

function contextFor(doc: string, explicit = true): CompletionContext {
  const state = EditorState.create({ doc });
  return new CompletionContext(state, doc.length, explicit);
}

test("completes code keywords after a hash", async () => {
  const result = await typstKeywordCompletion(contextFor("#se"));
  expect(result).not.toBeNull();
  expect(result!.from).toBe(0);
  const labels = result!.options.map((option) => option.label);
  expect(labels).toContain("#set");
  expect(labels).toContain("#show");
  expect(labels).not.toContain("#set ");
});

test("offers no completion without a hash", async () => {
  expect(await typstKeywordCompletion(contextFor("se"))).toBeNull();
  expect(await typstKeywordCompletion(contextFor("#", false))).toBeNull();
});

test("offers diff markers after a hash", async () => {
  const result = await typstMarkerCompletion(contextFor("#a"));
  expect(result).not.toBeNull();
  expect(result!.from).toBe(0);
  const labels = result!.options.map((option) => option.label);
  expect(labels).toContain("#add");
  expect(labels).toContain("#remove");
});

test("completing a marker inserts brackets with the cursor inside", async () => {
  const result = await typstMarkerCompletion(contextFor("#add"));
  const option = result!.options.find((option) => option.label === "#add")!;
  const dispatched: Array<{
    changes: { from: number; to: number; insert: string };
    selection: { anchor: number };
  }> = [];
  const fakeView = {
    dispatch: (spec: (typeof dispatched)[number]) => dispatched.push(spec),
  };
  // The `Completion` type widens `apply` to `string | function`; ours is the
  // function variant.
  const apply = option.apply as (
    view: EditorView,
    completion: Completion,
    from: number,
    to: number,
  ) => void;
  apply(fakeView as never, option, 0, 4);
  const spec = dispatched[0]!;
  expect(spec.changes).toEqual({ from: 0, to: 4, insert: "#add[]" });
  // "#add[" is 5 characters, so the cursor lands before the closing bracket.
  expect(spec.selection).toEqual({ anchor: 5 });
});
