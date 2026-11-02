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
  import CommentForm from "./CommentForm.svelte";
  import CommentItem from "./CommentItem.svelte";
  import type { CommentType, CommentWithMember, MentionRequest } from "./types";

  const ALWAYS_SHOWN_COMMENTS = 3;

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
  let mentionRequest = $state<MentionRequest | null>(null);
  let mentionCounter = 0;

  const canComment = $derived(
    !!page.data.member && isAuthorized(apiNames[type].COMMENT, page.data.user),
  );
  const hiddenCount = $derived(
    Math.max(comments.length - ALWAYS_SHOWN_COMMENTS, 0),
  );
  const visibleComments = $derived(
    showAll || hiddenCount === 0
      ? comments
      : comments.slice(0, ALWAYS_SHOWN_COMMENTS),
  );

  function reply(comment: CommentWithMember) {
    mentionRequest = { id: ++mentionCounter, member: comment.member };
  }
</script>

<section class="flex flex-col gap-1" aria-labelledby="comments-title">
  <div class="flex flex-row items-baseline gap-2">
    <h3 id="comments-title">{m.comments_title()}</h3>
    <span class="text-muted-foreground text-sm">({comments.length})</span>
  </div>

  {#if canComment && page.data.member}
    <CommentForm author={page.data.member} {commentForm} {mentionRequest} />
    <Separator class="my-2" />
  {/if}

  {#if comments.length === 0}
    <p class="text-muted-foreground text-sm">{m.comments_empty()}</p>
  {:else}
    <div class="flex flex-col divide-y">
      {#each visibleComments as comment (comment.id)}
        <CommentItem
          {comment}
          {type}
          {taggedMembers}
          {removeCommentForm}
          canReply={canComment}
          onReply={() => reply(comment)}
        />
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
