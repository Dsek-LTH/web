<script lang="ts">
  import { page } from "$app/stores";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { ComponentProps } from "svelte";
  import * as m from "$paraglide/messages";

  export let editing: boolean;
  export let toggleEditing: () => void;
  export let uniqueMemberCount: number;
  export let numberOfMandates: number;
  export let committee: {
    name: ComponentProps<PageHeader>["title"];
  } & ComponentProps<CommitteeIcon>["committee"];
</script>

<header class="mb-2 flex items-center gap-4">
  <figure class="w-14">
    <CommitteeIcon {committee} />
  </figure>
  <div class="flex-1">
    <div class="flex flex-wrap items-center justify-between">
      <PageHeader title={committee.name} class="mb-0" />
      {#if isAuthorized(apiNames.COMMITTEE.UPDATE, $page.data.user) || isAuthorized(apiNames.POSITION.CREATE, $page.data.user)}
        <button class="btn btn-secondary btn-sm" on:click={toggleEditing}>
          {editing ? m.committees_stopEditing() : m.committees_edit()}
        </button>
      {/if}
    </div>
    <h2>
      {uniqueMemberCount}
      {m.committees_volunteers()}, {numberOfMandates}
      {m.committees_differentMandates()}
    </h2>
  </div>
</header>
