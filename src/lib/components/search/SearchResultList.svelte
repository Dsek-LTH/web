<script lang="ts">
  import MemberSearchResult from "$lib/components/search/MemberSearchResult.svelte";
  import PositionSearchResult from "$lib/components/search/PositionSearchResult.svelte";
  import ArticleSearchResult from "$lib/components/search/ArticleSearchResult.svelte";
  import EventSearchResult from "$lib/components/search/EventSearchResult.svelte";
  import SongSearchResult from "$lib/components/search/SongSearchResult.svelte";
  import CommitteeSearchResult from "$lib/components/search/CommitteeSearchResult.svelte";
  import type { SearchDataWithType } from "$lib/search/searchTypes";
  import DocumentSearchResult from "$lib/components/search/DocumentSearchResult.svelte";

  export let results: SearchDataWithType[] = [];
</script>

{#each results as searchValue}
  {#if searchValue.type === "members"}
    <MemberSearchResult member={searchValue.data} />
  {:else if searchValue.type === "positions"}
    <PositionSearchResult position={searchValue.data} />
  {:else if searchValue.type === "articles"}
    <ArticleSearchResult article={searchValue.data} />
  {:else if searchValue.type === "events"}
    <EventSearchResult event={searchValue.data} />
  {:else if searchValue.type === "songs"}
    <SongSearchResult song={searchValue.data} />
  {:else if searchValue.type === "committees"}
    <CommitteeSearchResult committee={searchValue.data} />
  {:else if searchValue.type === "governingDocuments" || searchValue.type == "meetingDocuments"}
    <DocumentSearchResult document={searchValue} />
  {/if}
{/each}
