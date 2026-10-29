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
  import { superForm } from "$lib/utils/client/superForms";
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
  }: {
    comment: CommentWithMember;
    type: CommentType;
    taggedMembers: TaggedMember[];
    removeCommentForm: SuperValidated<RemoveCommentSchema>;
    canReply: boolean;
    onReply: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const { errors, constraints, enhance } = superForm(removeCommentForm, {
    id: comment.id,
    invalidateAll: true,
  });

  const content = $derived(
    replaceCommentTags(comment.content ?? "", taggedMembers),
  );
  const canDelete = $derived(
    isAuthorized(apiNames[type].COMMENT_DELETE, page.data.user) ||
      comment.memberId === page.data.user?.memberId,
  );
</script>

<article id="comment-{comment.id}" class="flex gap-3 py-3">
  <a
    href="/members/{comment.member.studentId}"
    class="shrink-0 transition-opacity hover:opacity-80"
  >
    <MemberAvatar member={comment.member} class="size-9" />
  </a>

  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <a
        href="/members/{comment.member.studentId}"
        class="font-medium break-words hover:underline"
      >
        {getFullName(comment.member)}
      </a>
      <time
        datetime={comment.published.toISOString()}
        class="text-muted-foreground text-xs"
      >
        {relativeDate(comment.published)}
      </time>

      <div class="ml-auto flex flex-row gap-1">
        {#if canReply}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={m.comments_reply()}
            title={m.comments_reply()}
            onclick={onReply}
          >
            <Reply />
          </Button>
        {/if}
        {#if canDelete}
          <form method="POST" action="?/removeComment" use:enhance>
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
    </div>

    <MarkdownBody body={content} class="text-sm [&_p]:my-1" />
  </div>
</article>
