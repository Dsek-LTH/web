<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { DeleteSchema } from "./+page.server";
  import Trash from "@lucide/svelte/icons/trash";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { cn } from "$lib/utils";

  let {
    data,
    fileId,
    fileName,
    class: klass,
  }: {
    data: SuperValidated<DeleteSchema>;
    fileId: string;
    fileName: string;
    class?: string;
  } = $props();

  const { enhance } = $derived(
    superForm(data, {
      id: fileId,
    }),
  );
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger
    class={cn(klass, buttonVariants({ size: "icon", variant: "outline" }))}
  >
    <Trash />
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <form method="POST" action="?/deleteFile" use:enhance>
      <input type="hidden" name="id" value={fileId} />
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
        <AlertDialog.Action type="submit"
          >{m.delete_delete()}</AlertDialog.Action
        >
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
