<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import TagChip from "$lib/components/TagChip.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Pen from "@lucide/svelte/icons/pen";
  import Plus from "@lucide/svelte/icons/plus";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const createForm = superForm(data.createForm, { id: "create" });
  // svelte-ignore state_referenced_locally
  const updateForm = superForm(data.updateForm, {
    id: "update",
    onUpdated: ({ form }) => {
      if (form.valid) editOpen = false;
    },
  });

  const { form: createFormData, enhance: createEnhance } = createForm;
  const {
    form: updateFormData,
    enhance: updateEnhance,
    errors: updateErrors,
  } = updateForm;

  let editOpen = $state(false);

  function startEdit(tag: (typeof data.tags)[number]) {
    $updateFormData.id = tag.id;
    $updateFormData.nameSv = tag.nameSv;
    $updateFormData.nameEn = tag.nameEn;
    $updateFormData.color = tag.color ?? "#888888";
    editOpen = true;
  }
</script>

<SetPageTitle title={m.news_tags_newsTags()} />

<div class="mx-auto max-w-4xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.news_tags_newsTags()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.news_tags_addNew()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/create"
        use:createEnhance
        class="flex items-end gap-2"
      >
        <div class="flex flex-1 flex-col gap-2">
          <Label for="nameSv">{m.news_tags_tagName()}</Label>
          <Input id="nameSv" name="nameSv" bind:value={$createFormData.nameSv} required />
        </div>
        <Button type="submit" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          {m.news_tags_create()}
        </Button>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>{m.news_tags()}</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col divide-y">
      {#each data.tags as tag (tag.id)}
        <div class="flex items-center justify-between gap-4 py-3">
          <TagChip {tag} />
          <Button
            variant="ghost"
            size="sm"
            class="flex items-center gap-2"
            onclick={() => startEdit(tag)}
          >
            <Pen class="h-4 w-4" />
            {m.news_tags_edit()}
          </Button>
        </div>
      {/each}
    </CardContent>
  </Card>
</div>

<Dialog.Root bind:open={editOpen}>
  <Dialog.Content class="sm:max-w-md">
    <form method="POST" action="?/update" use:updateEnhance class="flex flex-col gap-4">
      <input type="hidden" name="id" bind:value={$updateFormData.id} />
      <Dialog.Header>
        <Dialog.Title>{m.news_tags_edit()}</Dialog.Title>
      </Dialog.Header>

      <div class="flex flex-col gap-2">
        <Label for="update-nameSv">{m.news_tags_tagName()} (SV)</Label>
        <Input id="update-nameSv" name="nameSv" bind:value={$updateFormData.nameSv} />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="update-nameEn">{m.news_tags_tagName()} (EN)</Label>
        <Input id="update-nameEn" name="nameEn" bind:value={$updateFormData.nameEn} />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="update-color">{m.news_tags_color()}</Label>
        <div class="flex items-center gap-3">
          <input
            id="update-color"
            name="color"
            type="color"
            bind:value={$updateFormData.color}
            class="h-9 w-14 rounded border"
          />
          <span class="text-muted-foreground text-sm"
            >{m.news_tags_preview()}:</span
          >
          <TagChip
            tag={{
              name: $updateFormData.nameSv ?? "",
              color: $updateFormData.color ?? null,
            }}
          />
        </div>
        {#if $updateErrors.color}
          <p class="text-destructive text-sm font-medium">
            {$updateErrors.color}
          </p>
        {/if}
      </div>

      <Dialog.Footer>
        <Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
          {m.cancel()}
        </Dialog.Close>
        <Button type="submit">{m.news_tags_save()}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
