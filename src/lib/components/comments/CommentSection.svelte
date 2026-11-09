<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import { page } from "$app/state";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { TaggedMember } from "$lib/utils/client/commentTagging";
  import type { CommentSchema, RemoveCommentSchema } from "$lib/zod/comments";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";
  import { SvelteSet } from "svelte/reactivity";
  import CommentForm from "./CommentForm.svelte";
  import CommentThread, { MAX_INDENT_DEPTH } from "./CommentThread.svelte";
  import { buildCommentTree, countVisibleComments } from "./threads";
  import type { CommentType, CommentWithMember, MentionRequest } from "./types";

  const ALWAYS_SHOWN_THREADS = 3;

  let {
    type,
    comments,
    taggedMembers,
    commentForm,
    removeCommentForm,
  }: {
    type: CommentType;
    comments: CommentWithMember[];
    taggedMembers: TaggedMember[];
    commentForm: SuperValidated<CommentSchema>;
    removeCommentForm: SuperValidated<RemoveCommentSchema>;
  } = $props();

  let showAll = $state(false);
  const expanded = new SvelteSet<string>();
  /** The one open reply form: the comment it answers, and who to @mention in it. */
  let replyTarget = $state<{
    commentId: string;
    mention: MentionRequest | null;
  } | null>(null);
  let mentionCounter = 0;

  const canComment = $derived(
    !!page.data.member && isAuthorized(apiNames[type].COMMENT, page.data.user),
  );
  const tree = $derived(buildCommentTree(comments));
  const commentCount = $derived(countVisibleComments(comments));
  const hiddenCount = $derived(Math.max(tree.length - ALWAYS_SHOWN_THREADS, 0));
  const visibleThreads = $derived(
    showAll || hiddenCount === 0 ? tree : tree.slice(0, ALWAYS_SHOWN_THREADS),
  );

  function reply(comment: CommentWithMember, depth: number) {
    // Nesting shows who a reply answers, except past the indent limit, where replies
    // line up with their parent; there an @mention says it instead. Never to yourself.
    const needsMention =
      depth >= MAX_INDENT_DEPTH && comment.memberId !== page.data.member?.id;
    replyTarget = {
      commentId: comment.id,
      mention:
        needsMention && comment.member
          ? { id: ++mentionCounter, member: comment.member }
          : null,
    };
  }
</script>

<section class="flex flex-col gap-1" aria-labelledby="comments-title">
  <div class="flex flex-row items-baseline gap-2">
    <h3 id="comments-title">{m.comments_title()}</h3>
    <span class="text-muted-foreground text-sm">({commentCount})</span>
  </div>

  {#if canComment && page.data.member}
    <CommentForm author={page.data.member} {commentForm} />
    <Separator class="my-2" />
  {/if}

  {#if tree.length === 0}
    <p class="text-muted-foreground text-sm">{m.comments_empty()}</p>
  {:else}
    <div class="flex flex-col divide-y">
      {#each visibleThreads as node (node.comment.id)}
        <div class="flex flex-col pb-1">
          <CommentThread
            {node}
            {type}
            {taggedMembers}
            {commentForm}
            {removeCommentForm}
            {canComment}
            {replyTarget}
            {expanded}
            onReply={reply}
            onCloseReply={() => (replyTarget = null)}
          />
        </div>
      {/each}
    </div>
    {#if hiddenCount > 0}
      <Button
        variant="ghost"
        size="sm"
        class="w-fit"
        aria-expanded={showAll}
        onclick={() => (showAll = !showAll)}
      >
        {showAll
          ? m.comments_hideEarlier()
          : m.comments_showEarlier({ count: hiddenCount })}
      </Button>
    {/if}
  {/if}
</section>
