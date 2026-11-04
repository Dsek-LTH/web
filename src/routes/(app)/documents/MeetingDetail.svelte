<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { DeleteFileSchema } from "./schemas";
  import type { DocumentMeeting } from "./grouping";
  import GroupColumns from "./GroupColumns.svelte";
  import { Button } from "$lib/components/ui/button";
  import X from "@lucide/svelte/icons/x";
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";

  let {
    meeting,
    deleteForm,
    isEditing,
    canEdit,
    onClose,
    class: klass,
  }: {
    meeting: DocumentMeeting | null;
    deleteForm: SuperValidated<DeleteFileSchema>;
    isEditing: boolean;
    canEdit: boolean;
    onClose?: () => void;
    class?: string;
  } = $props();

  let groups = $derived.by(() => {
    if (!meeting) return [];

    const sorted = [...meeting.groups].sort((a, b) => {
      if (a.name === null) return 1;
      if (b.name === null) return -1;
      return a.name.localeCompare(b.name, "sv");
    });

    let lastLetter = "";
    return sorted.map((group) => {
      const displayName = group.name ?? m.documents_uncategorized();
      const letter = displayName.charAt(0).toUpperCase();
      const showSortKey = letter !== lastLetter;
      lastLetter = letter;

      return { group, displayName, sortKey: letter, showSortKey };
    });
  });
</script>

{#if !meeting}
  <div
    class={cn(
      "text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm",
      klass,
    )}
  >
    {m.documents_selectMeeting()}
  </div>
{:else}
  <section class={cn("bg-background overflow-hidden rounded-md border", klass)}>
    <header
      class="bg-muted-background flex items-center justify-between gap-2 border-b px-3 py-2"
    >
      <h3 class="text-base font-semibold">{meeting.name}</h3>
      {#if onClose}
        <Button
          variant="ghost"
          size="icon-sm"
          onclick={onClose}
          aria-label={m.documents_close()}
        >
          <X class="size-4" />
        </Button>
      {/if}
    </header>

    <div class="p-3">
      <p
        class="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase"
      >
        {m.documents_allDocuments()}
      </p>

      {#if groups.length === 0}
        <p class="text-muted-foreground py-4 text-center text-sm">
          {m.documents_noDocuments()}
        </p>
      {:else}
        <GroupColumns {groups} {deleteForm} {isEditing} {canEdit} />
      {/if}
    </div>
  </section>
{/if}
