<script lang="ts">
  import {
    type SuperForm,
    type SuperValidated,
  } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import type { SmallMemberSchema, EditSchema } from "../types";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import DeleteAlbumForm from "./DeleteAlbumForm.svelte";
  import {
    CalendarDateTime,
    fromDate,
    getLocalTimeZone,
    parseDate,
    toCalendarDate,
  } from "@internationalized/date";

  let {
    data,
  }: { data: { id: string; slug: string; form: SuperValidated<EditSchema> } } =
    $props();

  let { form, constraints, errors, enhance } = $derived(
    superForm(data.form, {
      resetForm: false,
      dataType: "json",
    }) as SuperForm<EditSchema>,
  );

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

<SetPageTitle title={m.gallery_edit_album()} />

<div class="layout-container">
  <a href={`/gallery/album/${data.slug}`} class="btn btn-outline btn-sm my-2"
    >{m.gallery_back()}</a
  >
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-bold">{m.gallery_edit_album()}</h1>
    <DeleteAlbumForm slug={data.slug} />
  </div>
  <p class="text-muted-foreground my-2 text-sm">
    {m.gallery_album_id()}:
    <code class="bg-muted rounded px-1 py-0.5 text-xs">{data.id}</code>
  </p>
  <form
    id="edit-album"
    class="form-control flex flex-col items-stretch gap-4"
    method="POST"
    action="?/save"
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
        aria-invalid={$errors.title ? true : false}
        aria-errormessage={$errors.title?.at(0)}
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
        aria-invalid={$errors.description ? true : false}
        aria-errormessage={$errors.description?.at(0)}
        {...$constraints.description}
      />
    </div>

    <Button class="btn btn-primary" type="submit">
      {m.gallery_save_edit()}
    </Button>
  </form>
</div>
