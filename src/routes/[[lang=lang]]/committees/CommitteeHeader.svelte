<script lang="ts">
  import CommitteeIcon from "$lib/components/CommitteeIcon.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { ComponentProps } from "svelte";

  export let editing: boolean;
  export let toggleEditing: () => void;
  export let accessPolicies: string[];
  export let uniqueMemberCount: number;
  export let numberOfMandates: number;
  export let committee: {
    name: ComponentProps<PageHeader>["title"];
    imageUrl: ComponentProps<CommitteeIcon>["imageUrl"];
  };
</script>

<header class="mb-2 flex items-center gap-4">
  <figure class="w-14">
    <CommitteeIcon imageUrl={committee.imageUrl} />
  </figure>
  <div class="flex-1">
    <div class="flex flex-wrap items-center justify-between">
      <PageHeader title={committee.name} class="mb-0" />
      {#if accessPolicies.includes(apiNames.COMMITTEE.UPDATE) || accessPolicies.includes(apiNames.POSITION.CREATE)}
        <button class="btn btn-secondary btn-sm" on:click={toggleEditing}>
          {editing ? "Sluta redigera" : "Redigera"}
        </button>
      {/if}
    </div>
    <h2>
      {uniqueMemberCount} funktionärer, {numberOfMandates} olika mandat
    </h2>
  </div>
</header>
