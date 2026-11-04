<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteFileSchema } from "./schemas";
  import type { EditSchema } from "./+page.server";
  import type { DocumentGroup } from "./grouping";
  import DeleteFileForm from "./DeleteFileForm.svelte";
  import EditFileForm from "./EditFileForm.svelte";
  import FileLink from "$lib/components/files/FileLink.svelte";
  import { cn } from "$lib/utils";

  let {
    group,
    displayName,
    deleteForm,
    editForm,
    availableGroups,
    isEditing,
    canDelete,
    canUpdate,
    class: klass,
  }: {
    group: DocumentGroup;
    displayName: string;
    deleteForm: SuperValidated<DeleteFileSchema>;
    editForm: SuperValidated<EditSchema>;
    availableGroups: string[];
    isEditing: boolean;
    canDelete: boolean;
    canUpdate: boolean;
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
          url={file.thumbnailUrl ?? ""}
          full
        />
        {#if isEditing && canUpdate}
          <EditFileForm
            class="size-7 shrink-0"
            fileId={file.id}
            fileName={file.name}
            bucket={file.bucket}
            group={group.name}
            groups={availableGroups}
            data={editForm}
          />
        {/if}
        {#if isEditing && canDelete}
          <DeleteFileForm
            class="size-7 shrink-0"
            fileId={file.id}
            fileName={file.name}
            bucket={file.bucket}
            data={deleteForm}
          />
        {/if}
      </div>
    {/each}
  </div>
</div>
