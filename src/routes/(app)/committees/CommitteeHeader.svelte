<script lang="ts">
  import { page } from "$app/state";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { ComponentProps } from "svelte";
  import * as m from "$paraglide/messages";

  interface Props {
    editing: boolean;
    toggleEditing: () => void;
    uniqueMemberCount: number;
    numberOfMandates: number;
    committee: {
      name: ComponentProps<PageHeader>["title"];
    } & ComponentProps<CommitteeIcon>["committee"];
  }

  let {
    editing,
    toggleEditing,
    uniqueMemberCount,
    numberOfMandates,
    committee,
  }: Props = $props();
</script>

<header class="mb-2 flex items-center gap-4">
  <figure class="w-14">
    <CommitteeIcon {committee} />
  </figure>
  <div class="flex-1">
    <div class="flex flex-wrap items-center justify-between">
      <PageHeader title={committee.name} class="mb-0" />
      {#if isAuthorized(apiNames.COMMITTEE.UPDATE, page.data.user) || isAuthorized(apiNames.POSITION.CREATE, page.data.user)}
        <button class="btn btn-secondary btn-sm" onclick={toggleEditing}>
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
