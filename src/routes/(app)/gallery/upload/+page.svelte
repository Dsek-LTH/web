<script lang="ts">
  import {
    type SuperForm,
    type SuperValidated,
  } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { type SmallMemberSchema, type UploadSchema } from "./types";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import SuperDebug from "sveltekit-superforms";

  let { data }: { data: { form: SuperValidated<UploadSchema> } } = $props();

  let { form, constraints, errors, enhance } = $derived(
    superForm(data.form, {
      resetForm: false,
      dataType: "json",
    }) as SuperForm<UploadSchema>,
  );

  let coverFiles: FileList | undefined = $state();
  let albumFiles: FileList | undefined = $state();

  function onCoverFileUpload() {
    $form.coverFile = coverFiles ? coverFiles[0] : undefined;
  }

  function onAlbumFileUpload() {
    // @ts-expect-error -- expected
    $form.albumFiles = [...albumFiles];
  }
</script>

<SetPageTitle title={m.gallery_uploadAlbum()} />
<div class="layout-container">
  <a href="/gallery" class="btn btn-outline btn-sm my-2">{m.gallery_back()}</a>
  <h1 class="text-2xl font-bold">{m.gallery_uploadAlbum()}</h1>
  <form
    id="upload-album"
    class="form-control items-stretch gap-4"
    method="POST"
    enctype="multipart/form-data"
    use:enhance
  >
    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="date"
        >{m.gallery_upload_date()}</Label
      >

      <Input
        id="date"
        name="date"
        class="input input-bordered"
        bind:value={$form.date}
        type="text"
        placeholder="2025-01-01"
        aria-invalid={$errors.date ? true : false}
        aria-errormessage={$errors.date?.at(0)}
        {...$constraints.date}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="title"
        >{m.gallery_upload_name()}</Label
      >
      <Input
        id="title"
        name="title"
        class="input input-bordered"
        bind:value={$form.title}
        type="text"
        placeholder="Nollefredagen"
        {...$constraints.title}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="photographers"
        >{m.gallery_upload_photographers()}</Label
      >
      <MemberSelector
        name="photographers"
        bind:selectedMembers={$form.photographers as SmallMemberSchema[]}
        multiple
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="editors"
        >{m.gallery_upload_editors()}</Label
      >
      <MemberSelector
        name="editors"
        bind:selectedMembers={$form.editors as SmallMemberSchema[]}
        multiple
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="description"
        >Beskrivning</Label
      >
      <Textarea
        id="description"
        name="description"
        class="input input-bordered"
        bind:value={$form.description}
        placeholder="En kort beskrivning av albumet"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="files">
        {m.gallery_upload_cover()}
      </Label>
      <FileUpload
        multiple={false}
        name="coverFile"
        onchange={() => onCoverFileUpload()}
        bind:files={() => coverFiles, (f) => (coverFiles = f)}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="files">
        {m.gallery_upload_files()}
      </Label>
      <FileUpload
        multiple
        name="albumFiles"
        onchange={() => onAlbumFileUpload()}
        bind:files={() => albumFiles, (f) => (albumFiles = f)}
      />
    </div>

    <Button
      class="btn btn-primary"
      type="submit"
      onclick={() => console.log("Submitting form with data:", $form)}
    >
      {m.gallery_upload_upload()}
    </Button>
  </form>
</div>
