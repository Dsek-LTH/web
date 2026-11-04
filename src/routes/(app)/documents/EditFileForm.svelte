<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { EditSchema } from "./+page.server";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import Label from "$lib/components/ui/label/label.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Pen from "@lucide/svelte/icons/pen";
  import { cn } from "$lib/utils";

  let {
    data,
    fileId,
    fileName,
    bucket,
    group,
    groups,
    class: klass,
  }: {
    data: SuperValidated<EditSchema>;
    fileId: string;
    fileName: string;
    bucket: string;
    group: string | null;
    groups: string[];
    class?: string;
  } = $props();

  let open = $state(false);

  // One-time form initialization; this component is recreated per file.
  // svelte-ignore state_referenced_locally
  const initial = { data, fileId, bucket, fileName, group };

  const formId = `edit-${initial.fileId.replace(/[^a-z0-9_-]/gi, "-")}`;
  const listId = `group-options-${formId}`;

  const formData = {
    ...initial.data,
    valid: true,
    errors: {},
    data: {
      ...initial.data.data,
      id: initial.fileId,
      bucket: initial.bucket,
      name: initial.fileName,
      group: initial.group ?? "",
    },
  };

  const {
    form,
    errors,
    enhance,
    message: formMessage,
  } = superForm(formData, {
    id: formId,
    onResult: (event) => {
      if (event.result.type === "success") open = false;
    },
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    class={cn(
      buttonVariants({ size: "icon", variant: "outline" }),
      "size-7 shrink-0",
      klass,
    )}
    aria-label={m.documents_editFile()}
  >
    <Pen class="size-3.5" />
  </Dialog.Trigger>

  <Dialog.Content class="sm:max-w-md">
    <form method="POST" action="?/editFile" use:enhance class="flex flex-col">
      <input type="hidden" name="id" value={fileId} />
      <input type="hidden" name="bucket" value={bucket} />

      <Dialog.Header>
        <Dialog.Title>{m.documents_editFile()}</Dialog.Title>
        <Dialog.Description>
          {m.documents_editFileDescription()}
        </Dialog.Description>
      </Dialog.Header>

      <div class="flex flex-col gap-4 px-4 pt-4 pb-4">
        <div class="flex flex-col gap-1.5">
          <Label for="edit-name-{formId}">{m.documents_fileName()}</Label>
          <Input
            id="edit-name-{formId}"
            name="name"
            bind:value={$form.name}
            aria-invalid={!!$errors.name}
            aria-errormessage={$errors.name?.at(0)}
          />
          <p class="text-muted-foreground text-xs">
            {m.documents_fileNameInfo()}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="edit-group-{formId}">{m.documents_group()}</Label>
          <Input
            id="edit-group-{formId}"
            name="group"
            list={listId}
            bind:value={$form.group}
            placeholder={m.documents_groupPlaceholder()}
            aria-invalid={!!$errors.group}
            aria-errormessage={$errors.group?.at(0)}
          />
          <datalist id={listId}>
            {#each groups as groupName (groupName)}
              <option value={groupName}></option>
            {/each}
          </datalist>
          <p class="text-muted-foreground text-xs">
            {m.documents_groupEditInfo()}
          </p>
        </div>

        {#if $formMessage?.type === "error"}
          <p class="text-destructive text-sm">{$formMessage.data.message}</p>
        {/if}
      </div>

      <Dialog.Footer class="px-4 py-3">
        <Dialog.Close class={buttonVariants({ variant: "outline" })}
          >{m.cancel()}</Dialog.Close
        >
        <Button type="submit">{m.save()}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
