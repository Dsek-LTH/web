<script lang="ts">
  import type { components } from "$lib/api/schema";
  import { api } from "$lib/api/client";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "$lib/stores/toast";
  import * as m from "$paraglide/messages";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import Label from "$lib/components/ui/label/label.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Pen from "@lucide/svelte/icons/pen";
  import { cn } from "$lib/utils";

  let {
    type,
    fileId,
    fileName,
    group,
    groups,
    class: klass,
  }: {
    type: components["schemas"]["MeetingType"];
    fileId: string;
    fileName: string;
    group: string;
    groups: string[];
    class?: string;
  } = $props();

  let open = $state(false);
  // The dialog starts from the file's current name and group each time it
  // opens; this component is recreated per file.
  // svelte-ignore state_referenced_locally
  let name = $state(fileName);
  // svelte-ignore state_referenced_locally
  let newGroup = $state(group);
  let error = $state<string | null>(null);
  let saving = $state(false);

  // svelte-ignore state_referenced_locally
  const formId = `edit-${fileId.replace(/[^a-z0-9_-]/gi, "-")}`;
  const listId = `group-options-${formId}`;

  // Go validates the name and group and does the rename; this only shows
  // its answer.
  async function save(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = null;
    const res = await api.PUT("/meeting-documents", {
      params: { query: { type, key: fileId } },
      body: { name, group: newGroup },
    });
    saving = false;
    if (res.error) {
      error =
        res.response.status === 409
          ? m.documents_errors_fileExists()
          : (res.error.detail ?? m.documents_errors_groupNotUpdated());
      return;
    }
    open = false;
    toast(m.documents_fileUpdated(), "success");
    await invalidateAll();
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (isOpen) {
      name = fileName;
      newGroup = group;
      error = null;
    }
  }}
>
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
    <form onsubmit={save} class="flex flex-col">
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
            required
            maxlength={200}
            bind:value={name}
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
            maxlength={80}
            bind:value={newGroup}
            placeholder={m.documents_groupPlaceholder()}
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

        {#if error}
          <p class="text-destructive text-sm">{error}</p>
        {/if}
      </div>

      <Dialog.Footer class="px-4 py-3">
        <Dialog.Close class={buttonVariants({ variant: "outline" })}
          >{m.cancel()}</Dialog.Close
        >
        <Button type="submit" disabled={saving}>{m.save()}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
