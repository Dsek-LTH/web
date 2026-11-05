import { describe, expect, it } from "vitest";
import {
  buildCommentTree,
  countVisibleComments,
  hideRemovedCommentAuthors,
} from "./threads";

const comment = (
  id: string,
  minute: number,
  parentId: string | null = null,
  content: string | null = `comment ${id}`,
) => ({
  id,
  parentId,
  content,
  published: new Date(2026, 10, 5, 12, minute),
});

const ids = (nodes: Array<{ comment: { id: string } }>) =>
  nodes.map((node) => node.comment.id);

describe("buildCommentTree", () => {
  it("puts newest top-level comments first and replies oldest first", () => {
    const tree = buildCommentTree([
      comment("a", 1),
      comment("b", 5),
      comment("a2", 9, "a"),
      comment("a1", 3, "a"),
    ]);

    expect(ids(tree)).toEqual(["b", "a"]);
    expect(ids(tree[1]!.replies)).toEqual(["a1", "a2"]);
  });

  it("nests replies to replies under the reply they answer", () => {
    const tree = buildCommentTree([
      comment("a", 1),
      comment("a1", 2, "a"),
      comment("a1x", 3, "a1"),
      comment("a1xy", 4, "a1x"),
    ]);

    const a1 = tree[0]!.replies[0]!;
    expect(a1.comment.id).toBe("a1");
    expect(ids(a1.replies)).toEqual(["a1x"]);
    expect(ids(a1.replies[0]!.replies)).toEqual(["a1xy"]);
  });

  it("keeps a removed comment only while something below it remains", () => {
    const tree = buildCommentTree([
      comment("gone", 1, null, null),
      comment("kept", 2, null, null),
      comment("removedReply", 3, "kept", null),
      comment("deepReply", 4, "removedReply"),
      comment("emptyChain", 5, null, null),
      comment("emptyChainReply", 6, "emptyChain", null),
    ]);

    expect(ids(tree)).toEqual(["kept"]);
    expect(ids(tree[0]!.replies[0]!.replies)).toEqual(["deepReply"]);
  });

  it("shows a reply whose parent is missing as a top-level comment", () => {
    expect(ids(buildCommentTree([comment("orphan", 1, "missing")]))).toEqual([
      "orphan",
    ]);
  });

  it("does not loop forever on a parent cycle", () => {
    const tree = buildCommentTree([
      comment("root", 1),
      comment("x", 2, "y"),
      comment("y", 3, "x"),
    ]);

    expect(ids(tree)).toEqual(["root"]);
  });
});

describe("hideRemovedCommentAuthors", () => {
  it("drops the member of removed comments only", () => {
    const member = { id: "m1" };
    const result = hideRemovedCommentAuthors([
      { ...comment("a", 1), member },
      { ...comment("b", 2, null, null), member },
    ]);

    expect(result.map((c) => c.member)).toEqual([member, null]);
  });
});

describe("countVisibleComments", () => {
  it("does not count removed placeholders", () => {
    expect(
      countVisibleComments([
        comment("a", 1),
        comment("b", 2, null, null),
        comment("c", 3, "b"),
      ]),
    ).toBe(2);
  });
});
