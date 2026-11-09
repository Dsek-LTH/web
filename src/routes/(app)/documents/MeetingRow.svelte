<script lang="ts">
  import type { FileData } from "$lib/files/fileHandler";
  import type { DocumentMeeting } from "./grouping";
  import { findLatestFile, meetingDocumentPrefixes } from "./grouping";
  import { Button } from "$lib/components/ui/button";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import FileText from "@lucide/svelte/icons/file-text";
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";

  let {
    meeting,
    selected,
    onSelect,
    class: klass,
  }: {
    meeting: DocumentMeeting;
    selected: boolean;
    onSelect: () => void;
    class?: string;
  } = $props();

  let notice = $derived(
    findLatestFile(meeting.files, meetingDocumentPrefixes.notice),
  );
  let agenda = $derived(
    findLatestFile(meeting.files, meetingDocumentPrefixes.agenda),
  );
  let minutes = $derived(
    findLatestFile(meeting.files, meetingDocumentPrefixes.minutes),
  );
</script>

{#snippet quickLink(label: string, file: FileData | undefined)}
  {#if file?.thumbnailUrl}
    <Button
      href={file.thumbnailUrl}
      target="_blank"
      rel="noreferrer"
      variant="outline"
      size="sm"
      class="h-7 gap-1"
    >
      <FileText class="text-rosa-background size-3" />
      {label}
    </Button>
  {:else}
    <Button variant="outline" size="sm" disabled class="h-7 gap-1">
      <FileText class="text-rosa-background size-3" />
      {label}
    </Button>
  {/if}
{/snippet}

<div
  class={cn(
    "bg-background hover:border-primary relative flex w-full max-w-full items-center gap-2 rounded-md border p-3 transition-colors",
    selected && "border-primary bg-rosa-50 dark:bg-rosa-950",
    klass,
  )}
>
  <button
    type="button"
    class="focus-visible:ring-ring absolute inset-0 z-0 rounded-md focus-visible:ring-2 focus-visible:outline-none"
    onclick={onSelect}
    aria-expanded={selected}
  >
    <span class="sr-only">{meeting.name}</span>
  </button>

  <div class="pointer-events-none relative z-10 flex w-full items-center gap-2">
    <span class="min-w-10 text-sm font-semibold">{meeting.name}</span>

    <div class="pointer-events-auto flex flex-wrap items-center gap-1">
      {@render quickLink(m.documents_notice(), notice)}
      {@render quickLink(m.documents_agenda(), agenda)}
      {@render quickLink(m.documents_minutes(), minutes)}
    </div>

    <ChevronRight
      aria-hidden="true"
      class={cn(
        "text-muted-foreground ml-auto size-4 shrink-0 transition-transform",
        selected && "rotate-90 md:rotate-0",
      )}
    />
  </div>
</div>
