<script lang="ts">
  import { page } from "$app/stores";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { tagRegex } from "$lib/utils/commentTagging";
  import { relativeDate } from "$lib/utils/datetime";
  import { getFullName } from "$lib/utils/member";
  import type { ArticleComment, EventComment, Member } from "@prisma/client";

  export let comment: ArticleComment | EventComment;
  export let author: Member;
  export let taggedMembers: Member[];
  export let onReply: () => void;
  const getReplacementValue = (studentId: string) => {
    const member: Member | undefined = taggedMembers.find(
      (member) => member.studentId === studentId
    );
    if (!member) return "@Unknown User";
    // Logic to return the replacement value based on the UUID
    // For example, this could be a lookup in a map or an API call
    return `@${getFullName(member)}`; // Replace this with actual logic
  };
  function replaceTag(inputText: string) {
    return inputText.replace(tagRegex, (match, visibleText, studentId) => {
      // Use the UUID to get the replacement value
      const replacement = getReplacementValue(studentId);
      // Replace the text in brackets with the replacement value
      return `[${replacement}](/members/${studentId})`;
    });
  }
  $: fixedContent = replaceTag(comment.content ?? "");
</script>

<section aria-label="Comment by {getFullName(author)}" class="relative mb-4">
  <header class="flex items-start gap-2">
    <a href="/members/{author.studentId}" class="">
      <MemberAvatar member={author} class="w-8 rounded-lg" />
    </a>
    <div class="flex-1 text-xs leading-snug">
      <a href="/members/{author.studentId}" class="link-primary link block no-underline">
        {getFullName(author)}
      </a>
      <span class="font-semibold opacity-50">{relativeDate(comment.published)}</span>
    </div>
  </header>
  <MarkdownBody body={fixedContent}></MarkdownBody>
  {#if $page.data.accessPolicies.includes(apiNames.NEWS.COMMENT)}
    <div class="absolute -top-4 right-0">
      <button class="btn btn-square btn-ghost btn-md" on:click={onReply}>
        <span class="i-mdi-reply text-xl" />
      </button>
    </div>
  {/if}
</section>
