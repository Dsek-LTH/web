<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import type { ArticleAuthorSummary } from "$lib/news/types";

  let {
    author,
    class: klass,
    lazy = true,
  }: {
    author: Pick<ArticleAuthorSummary, "type" | "member" | "customAuthor">;
    class?: string;
    lazy?: boolean;
  } = $props();

  const customInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
</script>

{#if author.type === "Custom" && author.customAuthor}
  <Avatar.Root class={klass}>
    <Avatar.Image
      {lazy}
      src={author.customAuthor.imageUrl}
      alt="Author image"
    />
    <Avatar.Fallback class="text-[0.6rem]"
      >{customInitials(author.customAuthor.name)}</Avatar.Fallback
    >
  </Avatar.Root>
{:else}
  <MemberAvatar {lazy} class={klass} member={author.member} />
{/if}
