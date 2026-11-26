<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { api } from "$lib/api/client";
  import * as m from "$paraglide/messages";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Spinner } from "$lib/components/ui/spinner";
  import { toast } from "$lib/stores/toast";
  import { cn } from "$lib/utils";
  import Download from "@lucide/svelte/icons/download";
  import Trash from "@lucide/svelte/icons/trash";

  // Pure-proxy mutation: deletes through Go directly (gallery:delete).
  let { slug, canDelete }: { slug: string; canDelete: boolean } = $props();

  let open = $state(false);
  let downloading = $state(false);
  let deleting = $state(false);

  async function downloadBackup() {
    downloading = true;
    try {
      const res = await api.GET("/albums/{slug}/download", {
        params: { path: { slug } },
        parseAs: "blob",
      });
      if (res.error || !res.data) {
        throw new Error(`Download failed with status ${res.response.status}`);
      }
      const blob = res.data as Blob;
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

  async function deleteAlbum() {
    deleting = true;
    const res = await api.DELETE("/albums/{slug}", {
      params: { path: { slug } },
    });
    deleting = false;
    if (res.error) {
      toast(m.gallery_delete_failed(), "error");
      return;
    }
    open = false;
    toast(m.gallery_album_deleted(), "success");
    await goto(resolve("/gallery"));
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
        <AlertDialog.Action
          onclick={deleteAlbum}
          disabled={downloading || deleting}
        >
          <Trash class="mr-2 size-4" />
          {m.gallery_delete_album()}
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}
