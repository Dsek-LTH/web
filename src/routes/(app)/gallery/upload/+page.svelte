<script lang="ts">
  import { filesProxy, type SuperForm } from "sveltekit-superforms/client";
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
  import { Spinner } from "$lib/components/ui/spinner";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Upload from "@lucide/svelte/icons/upload";
  import type { UploadSchema } from "./types";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
  }) as SuperForm<UploadSchema>;
  const files = $derived(filesProxy(form, "files"));
</script>

<SetPageTitle title={m.gallery_uploadAlbum()} />

<div class="mx-auto max-w-2xl px-4 py-8">
  <Button variant="ghost" href="/gallery" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.gallery_back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold">{m.gallery_uploadAlbum()}</CardTitle>
    </CardHeader>
    <CardContent class="pt-6">
      <form
        method="POST"
        enctype="multipart/form-data"
        use:enhance
        class="flex flex-col gap-6"
      >
        <div class="flex flex-col gap-2">
          <Label for="name">{m.gallery_upload_name()}</Label>
          <Input id="name" name="name" bind:value={$form.name} required />
          {#if $errors.name}
            <p class="text-destructive text-sm font-medium">{$errors.name}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="date">{m.gallery_upload_date()}</Label>
          <Input
            id="date"
            name="date"
            type="date"
            bind:value={$form.date}
            required
          />
          {#if $errors.date}
            <p class="text-destructive text-sm font-medium">{$errors.date}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="files">{m.gallery_upload_files()}</Label>
          <Input
            id="files"
            name="files"
            type="file"
            multiple
            bind:files={$files}
          />
          {#if $errors.files}
            <p class="text-destructive text-sm font-medium">{$errors.files}</p>
          {/if}
        </div>

        <div class="mt-4 flex items-center justify-end">
          <Button
            type="submit"
            disabled={$delayed}
            class="flex min-w-32 items-center gap-2"
          >
            {#if $delayed}
              <Spinner class="h-4 w-4" />
            {:else}
              <Upload class="h-4 w-4" />
              {m.gallery_upload_upload()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
