<script lang="ts">
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type {
    ArticleAuthorSummary,
    ArticleCommitteeSummary,
  } from "$lib/news/types";

  let {
    member,
    customAuthor = null,
    position,
    type = "Member",
    committee = null,
    links = true,
  }: {
    member: ArticleAuthorSummary["member"];
    customAuthor?: ArticleAuthorSummary["customAuthor"];
    position?: NonNullable<ArticleAuthorSummary["mandate"]>["position"];
    type?: ArticleAuthorSummary["type"];
    committee?: ArticleCommitteeSummary | null;
    links?: boolean;
  } = $props();
</script>

<div class="flex min-w-0 flex-row items-center gap-2">
  <AuthorCard {member} {customAuthor} {position} {type} {links} />
  {#if committee}
    <div class="bg-border h-8 w-px shrink-0"></div>
    <div class="flex min-w-0 flex-row items-center gap-2">
      <CommitteeSymbol {committee} />
      <span class="text-muted-foreground truncate">{committee.name}</span>
    </div>
  {/if}
</div>
