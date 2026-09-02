<script lang="ts">
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import FileText from "@lucide/svelte/icons/file-text";
  import Trash from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import FileLink from "./FileLink.svelte";
  import { api } from "$lib/api/client";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "$lib/stores/toast";
  import * as m from "$paraglide/messages";
  import type { components } from "$lib/api/schema";

  type Meeting = components["schemas"]["Meeting"];

  let {
    meeting,
    type,
    isEditing,
    canDelete,
  }: {
    meeting: Meeting;
    type: string;
    isEditing: boolean;
    canDelete: boolean;
  } = $props();

  // notice/agenda/minutes and the remaining files are now resolved
  // server-side (backend/internal/documents.buildMeeting) instead of this
  // component's own client-side findFile logic - see backend/CLAUDE.md's
  // Phase 4 section.

  // Pure-proxy mutation (see DESIGN.md's Principle #5) - direct Go call, no
  // SvelteKit action, matching the governing-documents list page's
  // removeDocument pattern. Go derives the correct bucket from `type`,
  // fixing the old app's delete-always-hits-documentsBucket bug.
  async function removeFile(id: string) {
    const res = await api.DELETE("/documents", { params: { query: { type, id } } });
    if (res.error) {
      toast(m.documents_fileDeleted(), "error");
      return;
    }
    toast(m.documents_fileDeleted(), "success");
    await invalidateAll();
  }
</script>

{#snippet deleteButton(file: { id: string; name: string })}
  <AlertDialog.Root>
    <AlertDialog.Trigger
      class={buttonVariants({ size: "icon", variant: "outline" })}
    >
      <Trash />
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title
          ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.documents_deleteAreYouSure({
            fileName: file.name,
          })}</AlertDialog.Title
        >
        <AlertDialog.Description>
          {m.documents_modal_subtitle()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
        <AlertDialog.Action onclick={() => removeFile(file.id)}
          >{m.delete_delete()}</AlertDialog.Action
        >
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/snippet}

<div>
  <h4 class="ml-2 pb-1">{meeting.name}</h4>
  <section class="flex flex-col rounded-md">
    <div
      class="bg-background flex flex-row flex-wrap gap-2 rounded-t-md border-[1px] p-2"
    >
      <a href={meeting.notice && meeting.notice.url}
        ><Button
          disabled={!meeting.notice}
          variant="outline"
          class="cursor-pointer rounded-sm"
          ><FileText class="text-rosa-background" />
          {m.documents_notice()}</Button
        ></a
      >
      <a href={meeting.agenda && meeting.agenda.url}
        ><Button
          variant="outline"
          disabled={!meeting.agenda}
          class="cursor-pointer rounded-sm"
          ><FileText class="text-rosa-background" />
          {m.documents_agenda()}</Button
        ></a
      >
      <a href={meeting.minutes && meeting.minutes.url}
        ><Button
          variant="outline"
          disabled={!meeting.minutes}
          class="cursor-pointer rounded-sm"
          ><FileText class="text-rosa-background" />
          {m.documents_minutes()}</Button
        ></a
      >
    </div>
    <div
      class="bg-muted-background mb-2 grid grid-flow-row grid-cols-1 gap-2 rounded-b-md border-[1px] border-t-0 px-2 pt-1 pb-2 sm:grid-cols-2 md:grid-cols-3"
    >
      {#each meeting.files ?? [] as file (file.id)}
        <div class="flex items-center gap-0">
          <FileLink
            class={isEditing
              ? "rounded-full! rounded-r-none! border-[1px] border-r-0"
              : ""}
            name={file.name}
            url={file.url}
            full
          />
          {#if isEditing && canDelete}
            {@render deleteButton(file)}
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>
