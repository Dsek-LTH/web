<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteFileSchema } from "./schemas";
  import type { DocumentGroup } from "./grouping";
  import DeleteFileForm from "./DeleteFileForm.svelte";
  import FileLink from "$lib/components/files/FileLink.svelte";
  import { cn } from "$lib/utils";

  let {
    group,
    displayName,
    sortKey,
    showSortKey,
    deleteForm,
    isEditing,
    canEdit,
    class: klass,
  }: {
    group: DocumentGroup;
    displayName: string;
    sortKey: string;
    showSortKey: boolean;
    deleteForm: SuperValidated<DeleteFileSchema>;
    isEditing: boolean;
    canEdit: boolean;
    class?: string;
  } = $props();

  let files = $derived(
    [...group.files].sort((a, b) => a.name.localeCompare(b.name, "sv")),
  );
</script>

<div
  class={cn("grid grid-cols-[10px_minmax(0,1fr)] items-start gap-1.5", klass)}
>
  <span
    class="text-muted-foreground pt-2 text-[8px] leading-none font-semibold tracking-wider uppercase"
    aria-hidden="true">{showSortKey ? sortKey : ""}</span
  >

  <div class="bg-background min-w-0 rounded-md border p-2">
    <div
      class="text-muted-foreground border-b pb-1 text-[10px] font-semibold tracking-wider uppercase"
    >
      {displayName}
    </div>

    <div class="pt-1">
      {#each files as file (file.id)}
        <div class="flex items-center gap-1">
          <FileLink
            class="min-w-0 flex-1 px-1.5 py-1 text-xs"
            name={file.name}
            url={file.thumbnailUrl ?? ""}
            full
          />
          {#if isEditing && canEdit}
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
</div>
