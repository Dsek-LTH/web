<script lang="ts">
  import type { components } from "$lib/api/schema";
  import GroupColumns from "./GroupColumns.svelte";
  import { Button } from "$lib/components/ui/button";
  import X from "@lucide/svelte/icons/x";
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";

  let {
    meeting,
    type,
    isEditing,
    onClose,
    class: klass,
  }: {
    meeting: components["schemas"]["Meeting"] | null;
    type: components["schemas"]["MeetingType"];
    isEditing: boolean;
    onClose?: () => void;
    class?: string;
  } = $props();
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

      {#if meeting.groups.length === 0}
        <p class="text-muted-foreground py-4 text-center text-sm">
          {m.documents_noDocuments()}
        </p>
      {:else}
        <GroupColumns groups={meeting.groups} {type} {isEditing} />
      {/if}
    </div>
  </section>
{/if}
