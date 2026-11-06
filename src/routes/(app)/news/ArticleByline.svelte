<script lang="ts">
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import type {
    ArticleAuthorSummary,
    ArticleCommitteeSummary,
  } from "$lib/news/types";
  import type { Snippet } from "svelte";

  let {
    member,
    customAuthor = null,
    position,
    type = "Member",
    committee = null,
    links = true,
    date,
  }: {
    member: ArticleAuthorSummary["member"];
    customAuthor?: ArticleAuthorSummary["customAuthor"];
    position?: NonNullable<ArticleAuthorSummary["mandate"]>["position"];
    type?: ArticleAuthorSummary["type"];
    committee?: ArticleCommitteeSummary | null;
    links?: boolean;
    /** Publish date, shown after the position on the author's second line. */
    date?: Snippet;
  } = $props();
</script>

<!-- Wraps on narrow screens: the committee drops to its own line and the divider hides,
     so it never dangles at the end of a line. -->
<div class="flex min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-1">
  <AuthorCard {member} {customAuthor} {position} {type} {links} meta={date} />
  {#if committee}
    <div class="bg-border hidden h-8 w-px shrink-0 sm:block"></div>
    <div class="flex min-w-0 flex-row items-center gap-2">
      <CommitteeSymbol {committee} />
      <span class="text-muted-foreground truncate">{committee.name}</span>
    </div>
  {/if}
</div>
