<script lang="ts">
  import { page } from "$app/stores";
  import CommentInput from "$lib/components/socials/CommentInput.svelte";
  import CommentRow from "$lib/components/socials/CommentRow.svelte";
  import type { ArticleComment, EventComment, Member } from "@prisma/client";
  export let comments: ((ArticleComment | EventComment) & {
    member: Member;
  })[];
  export let taggedMembers: Member[];
  export let commentContent: string | undefined = undefined;
  export let error: string | undefined = undefined;
  const ALWAYS_SHOWN_COMMENTS = 3;
</script>

{#if comments.length > 0}
  <div class:collapse-open={comments.length <= ALWAYS_SHOWN_COMMENTS} class="collapse bg-base-200">
    <input type="checkbox" />
    <div class="px-4">
      {#each comments.slice(comments.length - ALWAYS_SHOWN_COMMENTS) as comment (comment.id)}
        <CommentRow {comment} author={comment.member} {taggedMembers} />
      {/each}
    </div>
    <div class="collapse-title text-xl font-medium">
      Kommentarer {comments.length > ALWAYS_SHOWN_COMMENTS
        ? `(tryck för att visa ${comments.length - ALWAYS_SHOWN_COMMENTS} till)`
        : ""}
    </div>
    <div class="collapse-content !pb-0">
      {#each comments.slice(0, comments.length - ALWAYS_SHOWN_COMMENTS) as comment (comment.id)}
        <CommentRow {comment} author={comment.member} {taggedMembers} />
      {/each}
    </div>
  </div>
{/if}
<CommentInput author={$page.data.currentMember} value={commentContent} {error} />
