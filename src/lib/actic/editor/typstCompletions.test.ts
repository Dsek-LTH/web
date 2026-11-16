import { expect, test } from "vitest";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { typstKeywordCompletion } from "./typstCompletions";

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
