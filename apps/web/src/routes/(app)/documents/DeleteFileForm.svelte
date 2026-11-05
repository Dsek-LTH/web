<script lang="ts">
  import type { components } from "$lib/api/schema";
  import { api } from "$lib/api/client";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "$lib/stores/toast";
  import * as m from "$paraglide/messages";
  import Trash from "@lucide/svelte/icons/trash";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { cn } from "$lib/utils";

  let {
    type,
    fileId,
    fileName,
    class: klass,
  }: {
    type: components["schemas"]["MeetingType"];
    fileId: string;
    fileName: string;
    class?: string;
  } = $props();

  // Go picks the bucket the file lives in from type and its key (the SRD tab
  // lists files from both buckets) and removes it from its meeting's groups.
  async function remove() {
    const res = await api.DELETE("/meeting-documents", {
      params: { query: { type, key: fileId } },
    });
    if (res.error) {
      toast(res.error.detail ?? res.response.statusText, "error");
      return;
    }
    toast(m.documents_fileDeleted(), "success");
    await invalidateAll();
  }
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger
    class={cn(
      buttonVariants({ size: "icon", variant: "outline" }),
      "size-7 shrink-0",
      klass,
    )}
    aria-label={m.delete_delete()}
  >
    <Trash class="size-3.5" />
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title
        ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.documents_deleteAreYouSure({ fileName })}</AlertDialog.Title
      >
      <AlertDialog.Description>
        {m.documents_modal_subtitle()}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={remove}
        >{m.delete_delete()}</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
