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

  let labelledGroups = $derived.by(() => {
    let lastLetter = "";
    return groups.map((group) => {
      const displayName = group.name ?? m.documents_uncategorized();
      const sortKey = displayName.charAt(0).toUpperCase();
      const showSortKey = sortKey !== lastLetter;
      lastLetter = sortKey;

      return { group, displayName, sortKey, showSortKey };
    });
  });

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
        <div class="grid grid-cols-[10px_minmax(0,1fr)] items-start gap-1.5">
          <span
            class="text-muted-foreground pt-2 text-[8px] leading-none font-semibold tracking-wider uppercase"
            aria-hidden="true">{item.showSortKey ? item.sortKey : ""}</span
          >
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
