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
  import { Spinner } from "$lib/components/ui/spinner";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import {
    CalendarDateTime,
    fromDate,
    getLocalTimeZone,
    parseDate,
    toCalendarDate,
  } from "@internationalized/date";

  let { data }: { data: { form: SuperValidated<UploadSchema> } } = $props();

  let { form, constraints, errors, enhance } = $derived(
    superForm(data.form, {
      resetForm: false,
      dataType: "json",
      onSubmit: () => {
        uploading = true;
      },
      onResult: () => {
        uploading = false;
      },
    }) as SuperForm<UploadSchema>,
  );

  let coverFiles: FileList | undefined = $state();
  let albumFiles: FileList | undefined = $state();
  let uploading = $state(false);

  function onCoverFileUpload() {
    $form.coverFile = coverFiles ? coverFiles[0] : undefined;
  }

  function onAlbumFileUpload() {
    // @ts-expect-error -- expected
    $form.albumFiles = [...albumFiles];
  }

  const tz = getLocalTimeZone();

  // These are immutable objects that are only re-assigned,
  // so using $state.raw avoids overhead.
  let date = $state.raw<string | undefined>(
    $form.date
      ? toCalendarDate(fromDate($form.date, tz)).toString()
      : toCalendarDate(fromDate(new Date(), tz)).toString(),
  );

  function updateDate() {
    if (date) {
      const parsed = parseDate(date);
      const dt = new CalendarDateTime(parsed.year, parsed.month, parsed.day);
      $form.date = dt.toDate(tz);
    }
  }
</script>

<SetPageTitle title={m.gallery_upload_album()} />
<div class="layout-container">
  <a href="/gallery" class="btn btn-outline btn-sm my-2">{m.gallery_back()}</a>
  <h1 class="text-2xl font-bold">{m.gallery_upload_album()}</h1>
  <form
    id="upload-album"
    class="form-control flex flex-col items-stretch gap-4"
    method="POST"
    enctype="multipart/form-data"
    use:enhance
  >
    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="date"
        >{m.gallery_date()}</Label
      >

      <DatePicker
        name="date"
        bind:value={() => date,
        (value) => {
          date = value;
          updateDate();
        }}
        aria-invalid={$errors.date ? true : false}
        aria-errormessage={$errors.date?.at(0)}
        {...$constraints.date}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="title"
        >{m.gallery_name()}</Label
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
        >{m.gallery_photographers()}</Label
      >
      <MemberSelector
        name="photographers"
        bind:selectedMembers={$form.photographers as SmallMemberSchema[]}
        multiple
        showId
        showClass
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="editors"
        >{m.gallery_editors()}</Label
      >
      <MemberSelector
        name="editors"
        bind:selectedMembers={$form.editors as SmallMemberSchema[]}
        multiple
        showId
        showClass
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="mb-1 text-lg font-medium" for="description"
        >{m.gallery_description()}</Label
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
        {m.gallery_cover()}
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
        {m.gallery_files()}
      </Label>
      <FileUpload
        multiple
        name="albumFiles"
        onchange={() => onAlbumFileUpload()}
        bind:files={() => albumFiles, (f) => (albumFiles = f)}
      />
    </div>

    {#if !uploading}
      <Button class="btn btn-primary" type="submit">
        {m.gallery_upload()}
      </Button>
    {:else}
      <Button class="btn btn-primary" disabled>
        <Spinner />
        {m.gallery_uploading()}
      </Button>
    {/if}
  </form>
</div>
