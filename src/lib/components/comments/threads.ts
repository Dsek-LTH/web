type ThreadableComment = {
  id: string;
  parentId: string | null;
  content: string | null;
  published: Date;
};

export type CommentNode<C extends ThreadableComment> = {
  comment: C;
  /** Oldest first, so a conversation reads top to bottom. */
  replies: Array<CommentNode<C>>;
};

/**
 * Turns a flat comment list into a reply tree, newest top-level comment first.
 * A removed comment (content `null`) is kept only while something below it remains,
 * and a reply whose parent is missing becomes a top-level comment rather than being lost.
 */
export function buildCommentTree<C extends ThreadableComment>(
  comments: C[],
): Array<CommentNode<C>> {
  const ids = new Set(comments.map((comment) => comment.id));
  const childrenOf = new Map<string, C[]>();
  const roots: C[] = [];

  for (const comment of comments) {
    if (comment.parentId && ids.has(comment.parentId)) {
      const siblings = childrenOf.get(comment.parentId) ?? [];
      siblings.push(comment);
      childrenOf.set(comment.parentId, siblings);
    } else {
      roots.push(comment);
    }
  }

  const byTime = (a: C, b: C) => a.published.getTime() - b.published.getTime();

  // Each comment has one parent, so walking down from the roots can't loop: comments in
  // a parent cycle (only possible with broken data) are never reached and not shown.
  const toNodes = (list: C[]): Array<CommentNode<C>> =>
    list
      .sort(byTime)
      .map((comment) => ({
        comment,
        replies: toNodes(childrenOf.get(comment.id) ?? []),
      }))
      .filter(
        (node) => node.comment.content !== null || node.replies.length > 0,
      );

  return toNodes(roots).reverse();
}

/**
 * A removed comment stays as a placeholder for its replies, but the page shouldn't
 * still reveal who wrote it, so its member and member ID are dropped before it is
 * sent to the client.
 */
export const hideRemovedCommentAuthors = <
  C extends { content: string | null; member: unknown; memberId: string },
>(
  comments: C[],
): Array<
  Omit<C, "member" | "memberId"> & {
    member: C["member"] | null;
    memberId: string | null;
  }
> =>
  comments.map((comment) =>
    comment.content === null
      ? { ...comment, member: null, memberId: null }
      : comment,
  );

/** Comments people can actually read, i.e. not counting removed placeholders. */
export const countVisibleComments = (
  comments: Array<{ content: string | null }>,
) => comments.filter((comment) => comment.content !== null).length;
