<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { Button } from "$lib/components/ui/button";
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
  import type { CommentWithMember } from "./types";

  let {
    comment,
    taggedMembers,
    removeCommentForm,
    canReply,
    onReply,
  }: {
    comment: CommentWithMember;
    taggedMembers: TaggedMember[];
    removeCommentForm: SuperValidated<RemoveCommentSchema>;
    canReply: boolean;
    onReply: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const { errors, constraints, enhance } = superForm(removeCommentForm, {
    id: comment.id,
    invalidateAll: true,
    onResult: ({ result }) => toastFormMessage(result),
  });

  const content = $derived(
    replaceCommentTags(comment.content ?? "", taggedMembers),
  );
  // Computed by Go: the comment's own author, or a moderator.
  const canDelete = $derived(comment.canDelete);
</script>

<article id="comment-{comment.id}" class="flex gap-3 py-3">
  <a
    href="/members/{comment.member.studentId}"
    class="shrink-0 transition-opacity hover:opacity-80"
  >
    <MemberAvatar member={comment.member} />
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
        datetime={new Date(comment.published).toISOString()}
        class="text-muted-foreground text-xs"
      >
        {relativeDate(new Date(comment.published))}
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
