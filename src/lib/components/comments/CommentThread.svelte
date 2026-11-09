<script lang="ts" module>
  /** Levels that get their own indent; deeper replies line up with the last one. */
  export const MAX_INDENT_DEPTH = 3;
  /** Replies shown per comment before the rest are collapsed behind "Show N more". */
  const ALWAYS_SHOWN_REPLIES = 2;
</script>

<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { page } from "$app/state";
  import type { TaggedMember } from "$lib/utils/client/commentTagging";
  import type { CommentSchema, RemoveCommentSchema } from "$lib/zod/comments";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { SvelteSet } from "svelte/reactivity";
  import CommentForm from "./CommentForm.svelte";
  import CommentItem from "./CommentItem.svelte";
  import CommentThread from "./CommentThread.svelte";
  import type { CommentNode } from "./threads";
  import type { CommentType, CommentWithMember, MentionRequest } from "./types";

  let {
    node,
    depth = 0,
    type,
    taggedMembers,
    commentForm,
    removeCommentForm,
    canComment,
    replyTarget,
    expanded,
    onReply,
    onCloseReply,
  }: {
    node: CommentNode<CommentWithMember>;
    depth?: number;
    type: CommentType;
    taggedMembers: TaggedMember[];
    commentForm: SuperValidated<CommentSchema>;
    removeCommentForm: SuperValidated<RemoveCommentSchema>;
    canComment: boolean;
    /** The comment whose reply form is open, anywhere in the section. */
    replyTarget: { commentId: string; mention: MentionRequest | null } | null;
    /** Comments whose collapsed replies have been expanded. */
    expanded: SvelteSet<string>;
    onReply: (comment: CommentWithMember, depth: number) => void;
    onCloseReply: () => void;
  } = $props();

  const id = $derived(node.comment.id);
  const isExpanded = $derived(expanded.has(id));
  const collapsedCount = $derived(
    isExpanded ? 0 : Math.max(node.replies.length - ALWAYS_SHOWN_REPLIES, 0),
  );
  const shownReplies = $derived(
    collapsedCount > 0
      ? node.replies.slice(0, ALWAYS_SHOWN_REPLIES)
      : node.replies,
  );
  const isReplying = $derived(replyTarget?.commentId === id);
  // Past the indent limit replies stay in this column, so they get no indent or branch.
  const indentsChildren = $derived(depth < MAX_INDENT_DEPTH);

  type ChildItem =
    | { kind: "form"; key: string }
    | { kind: "reply"; key: string; node: CommentNode<CommentWithMember> }
    | { kind: "more"; key: string };
  /** Everything hanging off this comment, in order, so each can get its branch. */
  const children = $derived<ChildItem[]>([
    ...(isReplying ? [{ kind: "form" as const, key: "form" }] : []),
    ...shownReplies.map((reply) => ({
      kind: "reply" as const,
      key: reply.comment.id,
      node: reply,
    })),
    ...(node.replies.length > ALWAYS_SHOWN_REPLIES
      ? [{ kind: "more" as const, key: "more" }]
      : []),
  ]);

  /*
   * Thread lines. The spine runs down from the centre of this comment's avatar
   * (32px avatar on top-level comments, 24px on replies), and each child gets an
   * elbow from the spine into its own avatar. Only children before the last one
   * continue the spine, so it ends at the last reply instead of running past it.
   *
   *   top-level: avatar centre x = 16px (left-4), children start at 36px (pl-9)
   *   reply:     avatar centre x = 12px (left-3), children start at 28px (pl-7)
   *   spine starts under the avatar: 12px padding + 32px (top-11), or 8px + 24px (top-8)
   *   elbows end at the child's avatar centre: 8px padding + 12px (h-5), or the
   *   button's centre 16px down (h-4)
   */
  const spineX = $derived(depth === 0 ? "left-4" : "left-3");
  const childIndent = $derived(depth === 0 ? "pl-9" : "pl-7");
  const elbowWidth = $derived(depth === 0 ? "w-5" : "w-4");
  const spineStart = $derived(depth === 0 ? "top-11" : "top-8");
</script>

{#snippet item(child: ChildItem)}
  {#if child.kind === "form"}
    {@render replyForm()}
  {:else if child.kind === "reply"}
    {@render replyThread(child.node)}
  {:else}
    {@render moreButton()}
  {/if}
{/snippet}

{#snippet replyForm()}
  {#if replyTarget && page.data.member}
    <div class="py-2">
      <CommentForm
        author={page.data.member}
        {commentForm}
        parentId={id}
        mentionRequest={replyTarget.mention}
        onCancel={onCloseReply}
        onPosted={onCloseReply}
      />
    </div>
  {/if}
{/snippet}

{#snippet replyThread(reply: CommentNode<CommentWithMember>)}
  <CommentThread
    node={reply}
    depth={depth + 1}
    {type}
    {taggedMembers}
    {commentForm}
    {removeCommentForm}
    {canComment}
    {replyTarget}
    {expanded}
    {onReply}
    {onCloseReply}
  />
{/snippet}

{#snippet moreButton()}
  <Button
    variant="ghost"
    size="sm"
    class="text-muted-foreground -ml-2 w-fit"
    aria-expanded={isExpanded}
    onclick={() => (isExpanded ? expanded.delete(id) : expanded.add(id))}
  >
    {isExpanded
      ? m.comments_hideReplies()
      : m.comments_showMoreReplies({ count: collapsedCount })}
  </Button>
{/snippet}

<div class="relative">
  {#if children.length > 0 && indentsChildren}
    <span
      aria-hidden="true"
      class="border-border absolute bottom-0 border-l {spineX} {spineStart}"
    ></span>
  {/if}
  <CommentItem
    comment={node.comment}
    {type}
    {taggedMembers}
    {removeCommentForm}
    canReply={canComment}
    isReply={depth > 0}
    onReply={() => onReply(node.comment, depth)}
  />
</div>

{#if indentsChildren}
  {#each children as child, index (child.key)}
    {@const last = index === children.length - 1}
    <div class="relative {childIndent}">
      {#if !last}
        <span
          aria-hidden="true"
          class="border-border absolute top-0 bottom-0 border-l {spineX}"
        ></span>
      {/if}
      <span
        aria-hidden="true"
        class="border-border absolute top-0 rounded-bl-[10px] border-b border-l {spineX} {elbowWidth} {child.kind ===
        'more'
          ? 'h-4'
          : 'h-5'}"
      ></span>
      {@render item(child)}
    </div>
  {/each}
{:else}
  {#each children as child (child.key)}
    {@render item(child)}
  {/each}
{/if}
