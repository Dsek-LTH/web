<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteFileSchema } from "./schemas";
  import type { EditSchema } from "./+page.server";
  import type { DocumentGroup } from "./grouping";
  import GroupCard from "./GroupCard.svelte";
  import * as m from "$paraglide/messages";

  let {
    groups,
    deleteForm,
    editForm,
    isEditing,
    canDelete,
    canUpdate,
  }: {
    groups: DocumentGroup[];
    deleteForm: SuperValidated<DeleteFileSchema>;
    editForm: SuperValidated<EditSchema>;
    isEditing: boolean;
    canDelete: boolean;
    canUpdate: boolean;
  } = $props();

  let availableGroups = $derived(
    groups
      .map((group) => group.name)
      .filter((name): name is string => name !== null),
  );

  let sortedGroups = $derived.by(() => {
    const sorted = [...groups].sort((a, b) => {
      if (a.name === null) return 1;
      if (b.name === null) return -1;
      return a.name.localeCompare(b.name, "sv");
    });

    let lastLetter = "";
    return sorted.map((group) => {
      const displayName = group.name ?? m.documents_uncategorized();
      const sortKey = displayName.charAt(0).toUpperCase();
      const showSortKey = sortKey !== lastLetter;
      lastLetter = sortKey;

      return { group, displayName, sortKey, showSortKey };
    });
  });

  let columns = $derived.by(() => {
    if (sortedGroups.length <= 1) return [sortedGroups];

    const split = Math.ceil(sortedGroups.length / 2);
    return [sortedGroups.slice(0, split), sortedGroups.slice(split)];
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
            {deleteForm}
            {editForm}
            {availableGroups}
            {isEditing}
            {canDelete}
            {canUpdate}
          />
        </div>
      {/each}
    </div>
  {/each}
</div>
