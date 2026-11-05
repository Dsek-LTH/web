<script lang="ts">
  import type { components } from "$lib/api/schema";
  import DeleteFileForm from "./DeleteFileForm.svelte";
  import EditFileForm from "./EditFileForm.svelte";
  import FileLink from "$lib/components/files/FileLink.svelte";
  import { cn } from "$lib/utils";

  let {
    group,
    displayName,
    availableGroups,
    type,
    isEditing,
    class: klass,
  }: {
    group: components["schemas"]["MeetingDocumentGroup"];
    displayName: string;
    availableGroups: string[];
    type: components["schemas"]["MeetingType"];
    isEditing: boolean;
    class?: string;
  } = $props();
</script>

<div class={cn("bg-background min-w-0 rounded-md border p-2", klass)}>
  <div
    class="text-muted-foreground border-b pb-1 text-[10px] font-semibold tracking-wider uppercase"
  >
    {displayName}
  </div>

  <div class="pt-1">
    {#each group.files as file (file.id)}
      <div class="flex items-center gap-1">
        <FileLink
          class="min-w-0 flex-1 px-1.5 py-1 text-xs"
          name={file.name}
          url={file.url}
          full
        />
        {#if isEditing && file.canEdit}
          <EditFileForm
            class="size-7 shrink-0"
            {type}
            fileId={file.id}
            fileName={file.name}
            group={group.name ?? ""}
            groups={availableGroups}
          />
        {/if}
        {#if isEditing && file.canDelete}
          <DeleteFileForm
            class="size-7 shrink-0"
            {type}
            fileId={file.id}
            fileName={file.name}
          />
        {/if}
      </div>
    {/each}
  </div>
</div>
