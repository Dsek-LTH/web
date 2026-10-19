<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import * as m from "$paraglide/messages";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Spinner } from "$lib/components/ui/spinner";
  import { toast } from "$lib/stores/toast";
  import { cn } from "$lib/utils";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import Download from "@lucide/svelte/icons/download";
  import Trash from "@lucide/svelte/icons/trash";

  let { slug }: { slug: string } = $props();

  let open = $state(false);
  let downloading = $state(false);

  const canDelete = $derived(
    isAuthorized(apiNames.GALLERY.DELETE, page.data.user),
  );

  async function downloadBackup() {
    downloading = true;
    try {
      const response = await fetch(`/gallery/album/${slug}/download`);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slug}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast(m.gallery_delete_backup_downloaded(), "success");
    } catch (e) {
      console.error("Failed to download album backup", e);
      toast(m.gallery_delete_download_failed(), "error");
    } finally {
      downloading = false;
    }
  }
</script>

{#if canDelete}
  <AlertDialog.Root bind:open>
    <AlertDialog.Trigger class={cn(buttonVariants({ variant: "destructive" }))}>
      <Trash class="mr-2 size-4" />
      {m.gallery_delete_album()}
    </AlertDialog.Trigger>
    <AlertDialog.Content class="z-200">
      <AlertDialog.Header>
        <AlertDialog.Title>{m.gallery_delete_dialog_title()}</AlertDialog.Title>
        <AlertDialog.Description>
          {m.gallery_delete_dialog_desc()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel disabled={downloading}
          >{m.cancel()}</AlertDialog.Cancel
        >
        <Button
          variant="outline"
          disabled={downloading}
          onclick={downloadBackup}
        >
          {#if downloading}
            <Spinner class="mr-2 size-4" />
            {m.gallery_downloading()}
          {:else}
            <Download class="mr-2 size-4" />
            {m.gallery_delete_download_backup()}
          {/if}
        </Button>
        <form
          method="POST"
          action="?/delete"
          use:enhance={() =>
            async ({ result, update }) => {
              if (result.type === "failure" || result.type === "error") {
                toast(m.gallery_delete_failed(), "error");
              }
              await update();
            }}
        >
          <AlertDialog.Action type="submit" disabled={downloading}>
            <Trash class="mr-2 size-4" />
            {m.gallery_delete_album()}
          </AlertDialog.Action>
        </form>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}
