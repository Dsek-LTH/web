<script lang="ts">
  import { fileProxy, type SuperForm } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Trash from "@lucide/svelte/icons/trash";
  import FileText from "@lucide/svelte/icons/file-text";
  import * as m from "$paraglide/messages.js";
  import type { UploadSchema } from "./+page.server";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance } = superForm(data.uploadForm, {
    id: "upload",
    resetForm: false,
  }) as SuperForm<UploadSchema>;
  const file = $derived(fileProxy(form, "file"));

  // svelte-ignore state_referenced_locally
  const { enhance: deleteEnhance } = superForm(data.deleteForm, {
    id: "delete",
  });
</script>

<SetPageTitle title={m.admin_minio_pageTitle()} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.admin_minio_pageTitle()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_minio_uploadTitle()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/upload"
        enctype="multipart/form-data"
        use:enhance
        class="flex flex-col gap-4"
      >
        <input type="hidden" name="prefix" value={data.prefix} />
        <div class="flex flex-col gap-2">
          <Label for="fileName">{m.admin_minio_fileName()}</Label>
          <Input id="fileName" name="fileName" bind:value={$form.fileName} />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="file">{m.fileupload_title()}</Label>
          <Input id="file" name="file" type="file" bind:files={$file} />
          {#if $errors.file}
            <p class="text-destructive text-sm font-medium">{$errors.file}</p>
          {/if}
        </div>
        {#if $form.fileUrl}
          <a
            href={$form.fileUrl}
            target="_blank"
            class="text-muted-foreground text-sm break-all hover:underline"
          >
            {$form.fileUrl}
          </a>
        {/if}
        <div class="flex justify-end">
          <Button type="submit">{m.fileupload_title()}</Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardContent class="flex flex-col divide-y">
      {#each data.files as file (file.id)}
        <div class="flex items-center justify-between gap-4 py-3">
          <a
            href={file.thumbnailUrl}
            target="_blank"
            class="flex items-center gap-2 hover:underline"
          >
            <FileText class="h-4 w-4 shrink-0" />
            {file.name}
          </a>
          <form method="POST" action="?/delete" use:deleteEnhance>
            <input type="hidden" name="id" value={file.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label={m.delete_delete()}
            >
              <Trash class="h-4 w-4" />
            </Button>
          </form>
        </div>
      {/each}
    </CardContent>
  </Card>
</div>
