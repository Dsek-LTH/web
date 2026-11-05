<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { Button } from "$lib/components/ui/button";
  import { page } from "$app/state";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import {
    replaceCommentTags,
    type TaggedMember,
  } from "$lib/utils/client/commentTagging";
  import { relativeDate } from "$lib/utils/client/datetime";
  import { getFullName } from "$lib/utils/client/member";
  import { superForm, toastFormMessage } from "$lib/utils/client/superForms";
  import type { RemoveCommentSchema } from "$lib/zod/comments";
  import * as m from "$paraglide/messages";
  import Reply from "@lucide/svelte/icons/reply";
  import Trash from "@lucide/svelte/icons/trash";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { CommentType, CommentWithMember } from "./types";

  let {
    comment,
    type,
    taggedMembers,
    removeCommentForm,
    canReply,
    onReply,
    isReply = false,
  }: {
    comment: CommentWithMember;
    type: CommentType;
    taggedMembers: TaggedMember[];
    removeCommentForm: SuperValidated<RemoveCommentSchema>;
    canReply: boolean;
    onReply: () => void;
    isReply?: boolean;
  } = $props();

  // Deleted comments that still have replies keep their place in the thread, without content.
  const isRemoved = $derived(comment.content === null);

  // svelte-ignore state_referenced_locally
  const { errors, constraints, enhance } = superForm(removeCommentForm, {
    id: comment.id,
    invalidateAll: true,
    onResult: ({ result }) => toastFormMessage(result),
  });

  const content = $derived(
    replaceCommentTags(comment.content ?? "", taggedMembers),
  );
  const canDelete = $derived(
    isAuthorized(apiNames[type].COMMENT_DELETE, page.data.user) ||
      comment.memberId === page.data.user?.memberId,
  );
</script>

<article
  id="comment-{comment.id}"
  class="flex scroll-mt-24 {isReply ? 'gap-2 py-2' : 'gap-3 py-3'}"
>
  {#if isRemoved || !comment.member}
    <div
      class="bg-muted-background shrink-0 rounded-full {isReply
        ? 'size-6'
        : 'size-8'}"
      aria-hidden="true"
    ></div>
    <p class="text-muted-foreground self-center text-sm italic">
      {m.comments_removedPlaceholder()}
    </p>
  {:else}
    <a
      href="/members/{comment.member.studentId}"
      class="shrink-0 transition-opacity hover:opacity-80"
    >
      <MemberAvatar member={comment.member} class={isReply ? "size-6" : ""} />
    </a>

    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <!-- Name and time may wrap; the delete button stays pinned top-right instead of wrapping with them. -->
      <div class="flex items-start gap-2">
        <div
          class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5"
        >
          <a
            href="/members/{comment.member.studentId}"
            class="text-sm font-medium break-words hover:underline"
          >
            {getFullName(comment.member)}
          </a>
          <time
            datetime={comment.published.toISOString()}
            class="text-muted-foreground text-xs"
          >
            {relativeDate(comment.published)}
          </time>
        </div>

        {#if canDelete}
          <form
            method="POST"
            action="?/removeComment"
            use:enhance
            class="-mt-1 shrink-0"
          >
            <input
              type="hidden"
              name="commentId"
              value={comment.id}
              {...$constraints.commentId}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label={m.comments_delete()}
              title={m.comments_delete()}
            >
              <Trash />
            </Button>
            {#if $errors.commentId}
              <p class="text-destructive text-xs">
                {$errors.commentId.at(0)}
              </p>
            {/if}
          </form>
        {/if}
      </div>

      <MarkdownBody body={content} class="text-sm [&_p]:my-1" />

      {#if canReply}
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-xs font-medium transition-colors"
          onclick={onReply}
        >
          <Reply class="size-3.5" aria-hidden="true" />
          {m.comments_reply()}
        </button>
      {/if}
    </div>
  {/if}
</article>
