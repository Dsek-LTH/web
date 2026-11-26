<script lang="ts">
  import type { components } from "$lib/api/schema";
  import GroupCard from "./GroupCard.svelte";
  import * as m from "$paraglide/messages";

  let {
    groups,
    type,
    isEditing,
  }: {
    /** As Go sorts them: named groups by name, then the ungrouped files. */
    groups: Array<components["schemas"]["MeetingDocumentGroup"]>;
    type: components["schemas"]["MeetingType"];
    isEditing: boolean;
  } = $props();

  let availableGroups = $derived(
    groups.flatMap((group) => (group.name ? [group.name] : [])),
  );

  // Go sends the groups sorted, the unnamed one last.
  let labelledGroups = $derived(
    groups.map((group) => ({
      group,
      displayName: group.name ?? m.documents_uncategorized(),
    })),
  );

  let columns = $derived.by(() => {
    if (labelledGroups.length <= 1) return [labelledGroups];

    const split = Math.ceil(labelledGroups.length / 2);
    return [labelledGroups.slice(0, split), labelledGroups.slice(split)];
  });
</script>

<div
  class="flex flex-col gap-y-2.5 md:flex-row md:items-start md:gap-x-3.5 md:gap-y-0"
>
  {#each columns as column, index (index)}
    <div class="flex min-w-0 flex-col gap-y-2.5 md:flex-1">
      {#each column as item (item.group.name ?? "__other__")}
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-1.5">
          <GroupCard
            group={item.group}
            displayName={item.displayName}
            {availableGroups}
            {type}
            {isEditing}
          />
        </div>
      {/each}
    </div>
  {/each}
</div>
