<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteFileSchema } from "./schemas";
  import type { DocumentGroup } from "./grouping";
  import GroupCard from "./GroupCard.svelte";

  type GroupItem = {
    group: DocumentGroup;
    displayName: string;
    sortKey: string;
    showSortKey: boolean;
  };

  let {
    groups,
    deleteForm,
    isEditing,
    canEdit,
  }: {
    groups: GroupItem[];
    deleteForm: SuperValidated<DeleteFileSchema>;
    isEditing: boolean;
    canEdit: boolean;
  } = $props();

  let columns = $derived.by(() => {
    if (groups.length <= 1) return [groups];

    const split = Math.ceil(groups.length / 2);
    return [groups.slice(0, split), groups.slice(split)];
  });
</script>

<div
  class="flex flex-col gap-y-2.5 md:flex-row md:items-start md:gap-x-3.5 md:gap-y-0"
>
  {#each columns as column, index (index)}
    <div class="flex min-w-0 flex-col gap-y-2.5 md:flex-1">
      {#each column as item (item.group.name ?? "__other__")}
        <GroupCard
          group={item.group}
          displayName={item.displayName}
          sortKey={item.sortKey}
          showSortKey={item.showSortKey}
          {deleteForm}
          {isEditing}
          {canEdit}
        />
      {/each}
    </div>
  {/each}
</div>
