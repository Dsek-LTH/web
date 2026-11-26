<script lang="ts">
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type {
    ArticleAuthorSummary,
    ArticleCommitteeSummary,
  } from "$lib/news/types";

  let {
    author,
    committee,
    links = true,
  }: {
    author: ArticleAuthorSummary;
    committee?: ArticleCommitteeSummary;
    links?: boolean;
  } = $props();
</script>

<div class="flex min-w-0 flex-row items-center gap-2">
  <AuthorCard {author} {links} />
  {#if committee}
    <div class="bg-border h-8 w-px shrink-0"></div>
    <div class="flex min-w-0 flex-row items-center gap-2">
      <CommitteeSymbol {committee} />
      <span class="text-muted-foreground truncate">{committee.name}</span>
    </div>
  {/if}
</div>
