<script lang="ts">
  import { page } from "$app/stores";
  import CommentInput from "$lib/components/socials/CommentInput.svelte";
  import CommentRow from "$lib/components/socials/CommentRow.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { CommentSchema, RemoveCommentSchema } from "$lib/zod/comments";
  import type { SuperValidated } from "sveltekit-superforms";
  export let comments: Array<
    (
      | ExtendedPrismaModel<"ArticleComment">
      | ExtendedPrismaModel<"EventComment">
    ) & {
      member: ExtendedPrismaModel<"Member">;
    }
  >;
  export let type: "NEWS" | "EVENT";
  export let taggedMembers: Array<ExtendedPrismaModel<"Member">>;
  export let commentForm: SuperValidated<CommentSchema>;
  export let removeCommentForm: SuperValidated<RemoveCommentSchema>;

  const ALWAYS_SHOWN_COMMENTS = 3;

  let onReply: (
    comment: (
      | ExtendedPrismaModel<"ArticleComment">
      | ExtendedPrismaModel<"EventComment">
    ) & { member: ExtendedPrismaModel<"Member"> },
  ) => void;
</script>

{#if comments.length > 0}
  <div
    class:collapse-open={comments.length <= ALWAYS_SHOWN_COMMENTS}
    class="collapse bg-base-200"
  >
    <input type="checkbox" />
    <div class="px-4">
      {#each comments.slice(comments.length - ALWAYS_SHOWN_COMMENTS) as comment (comment.id)}
        <CommentRow
          {comment}
          author={comment.member}
          {taggedMembers}
          onReply={() => onReply(comment)}
          {type}
          {removeCommentForm}
        />
      {/each}
    </div>
    <div class="collapse-title text-xl font-medium">
      Kommentarer {comments.length > ALWAYS_SHOWN_COMMENTS
        ? `(tryck för att visa ${comments.length - ALWAYS_SHOWN_COMMENTS} till)`
        : ""}
    </div>
    <div class="collapse-content !pb-0">
      {#each comments.slice(0, comments.length - ALWAYS_SHOWN_COMMENTS) as comment (comment.id)}
        <CommentRow
          {comment}
          author={comment.member}
          {taggedMembers}
          onReply={() => onReply(comment)}
          {type}
          {removeCommentForm}
        />
      {/each}
    </div>
  </div>
{/if}
{#if isAuthorized(apiNames[type].COMMENT, $page.data.user) && $page.data.member}
  <CommentInput author={$page.data.member} {commentForm} bind:onReply />
{/if}
