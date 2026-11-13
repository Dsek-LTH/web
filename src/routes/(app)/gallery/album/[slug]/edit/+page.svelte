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
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";

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

  let date = $derived<string | undefined>(
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
  <Button href={`/gallery/album/${data.slug}`} variant="ghost"
    ><ArrowLeft /> {m.gallery_back()}</Button
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
    class="flex flex-col items-stretch gap-4"
    method="POST"
    action="?/save"
    enctype="multipart/form-data"
    use:enhance
  >
    <div class="flex flex-col gap-1.5">
      <Label for="date">{m.gallery_date()}</Label>
      <DatePicker
        name="date"
        bind:value={
          () => date,
          (value) => {
            date = value;
            updateDate();
          }
        }
        aria-invalid={$errors.date ? true : false}
        aria-errormessage={$errors.date?.at(0)}
        {...$constraints.date}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="title">{m.gallery_name()}</Label>
      <Input
        id="title"
        name="title"
        bind:value={$form.title}
        type="text"
        placeholder="Nollefredagen"
        aria-invalid={$errors.title ? true : false}
        aria-errormessage={$errors.title?.at(0)}
        {...$constraints.title}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="photographers">{m.gallery_photographers()}</Label>
      <MemberSelector
        name="photographers"
        bind:selectedMembers={$form.photographers as SmallMemberSchema[]}
        multiple
        showId
        showClass
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="editors">{m.gallery_editors()}</Label>
      <MemberSelector
        name="editors"
        bind:selectedMembers={$form.editors as SmallMemberSchema[]}
        multiple
        showId
        showClass
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="description">{m.gallery_description()}</Label>
      <Textarea
        id="description"
        name="description"
        bind:value={$form.description}
        placeholder={m.gallery_album_shortDescription()}
        aria-invalid={$errors.description ? true : false}
        aria-errormessage={$errors.description?.at(0)}
        {...$constraints.description}
      />
    </div>

    <Button type="submit" class="w-fit">
      {m.gallery_save_edit()}
    </Button>
  </form>
</div>
