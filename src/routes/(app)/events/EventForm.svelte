<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";
  import {
    CalendarDateTime,
    fromDate,
    getLocalTimeZone,
    parseDate,
    toCalendarDate,
  } from "@internationalized/date";

  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import DateTimeSelector from "$lib/components/datetime-selector/DateTimeSelector.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import * as Select from "$lib/components/ui/select";
  import { Spinner } from "$lib/components/ui/spinner";
  import type { ActionType, EventFormSchema } from "$lib/events/schema";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { recurringTypes, type RecurringType } from "$lib/utils/events";
  import * as m from "$paraglide/messages";

  import Link from "@lucide/svelte/icons/link";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import Pen from "@lucide/svelte/icons/pen";
  import Users from "@lucide/svelte/icons/users";
  import X from "@lucide/svelte/icons/x";

  import type { EventCommittee } from "./Event.svelte";

  let {
    superform,
    allTags,
    committees,
    activeTab = $bindable(),
    creating = false,
    isRecurringEvent = false,
    cancelHref,
  }: {
    superform: SuperForm<EventFormSchema>;
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    committees: EventCommittee[];
    activeTab: "sv" | "en";
    /** Whether this is the create page (as opposed to editing an existing event). */
    creating?: boolean;
    /** Whether the event being edited belongs to a recurring series. */
    isRecurringEvent?: boolean;
    cancelHref: string;
  } = $props();

  const { form, errors, enhance, delayed } = $derived(superform);

  // Editing an event in a series asks which events to change, so there always
  // has to be a choice selected when the dialog is submitted.
  if (!$form.editType) $form.editType = "THIS";

  const formId = "event-form";

  // `startDatetime`/`endDatetime`/`recurringEndDatetime` are plain `Date`s in
  // the schema, but the date/time pickers work with wall-clock
  // `CalendarDateTime`s.
  const tz = getLocalTimeZone();
  const dateToCalendarDateTime = (date: Date) => {
    const zoned = fromDate(date, tz);
    return new CalendarDateTime(
      zoned.year,
      zoned.month,
      zoned.day,
      zoned.hour,
      zoned.minute,
    );
  };

  // These are immutable objects that are only re-assigned, so $state.raw
  // avoids proxying overhead. `DateTimeSelector` owns its own from/to sync
  // internally and expects a plain bindable it can reassign directly (not a
  // getter/setter pair recomputed from `$form` on every read, which its
  // internal effects don't handle) — so, same as ArticleForm.svelte does for
  // its publish time, these are initialized once from the form and pushed
  // back into it via `onTimeChange`.
  let fromDateTime = $state.raw(dateToCalendarDateTime($form.startDatetime));
  let toDateTime = $state.raw(dateToCalendarDateTime($form.endDatetime));

  const onDateTimeChange = (time: {
    fromCalendarDateTime: CalendarDateTime;
    toCalendarDateTime: CalendarDateTime;
  }) => {
    $form.startDatetime = time.fromCalendarDateTime.toDate(tz);
    $form.endDatetime = time.toCalendarDateTime.toDate(tz);
  };

  // `Select` needs a value for the "no committee" option.
  const NO_COMMITTEE = "none";

  const sortedCommittees = $derived(
    [...committees].sort((a, b) => a.name.localeCompare(b.name)),
  );

  // Events from before committees were selectable have a free text organizer
  // that is kept (and shown) until a committee is picked.
  const organizerLabel = $derived(
    committees.find(({ id }) => id === $form.committeeId)?.name ??
      ($form.organizer || m.events_noCommittee()),
  );

  const setCommittee = (value: string) => {
    const committee = committees.find(({ id }) => id === value);
    $form.committeeId = committee?.id ?? null;
    // The server sets this from the committee too. Choosing "none" clears any old text.
    $form.organizer = committee?.name ?? "";
  };

  const editTypes: Array<{ value: ActionType; label: string }> = [
    { value: "THIS", label: m.events_onlyEditThis() },
    { value: "FUTURE", label: m.events_editThisAndFuture() },
    { value: "ALL", label: m.events_editAll() },
  ];

  let imageFiles: FileList | undefined | null = $state();

  const askEditType = $derived(!creating && isRecurringEvent);
</script>

<form
  id={formId}
  method="POST"
  class="mb-8 flex w-full flex-col gap-4"
  enctype="multipart/form-data"
  use:enhance
>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-row items-end justify-between gap-2">
      <Label for={activeTab === "sv" ? "titleSv" : "titleEn"}
        >{m.events_title()}</Label
      >
      <ButtonGroup.Root>
        <Button
          type="button"
          class={activeTab === "sv" ? "bg-neutral-100 dark:bg-neutral-900" : ""}
          onclick={() => (activeTab = "sv")}
          variant="outline">{m.language_swedish()}</Button
        >
        <Button
          type="button"
          class={activeTab === "en" ? "bg-neutral-100 dark:bg-neutral-900" : ""}
          onclick={() => (activeTab = "en")}
          variant="outline">{m.language_english()}</Button
        >
      </ButtonGroup.Root>
    </div>
    {#if activeTab === "sv"}
      <Input
        bind:value={$form.titleSv}
        id="titleSv"
        name="titleSv"
        type="text"
        required
        aria-invalid={!!$errors.titleSv}
        aria-errormessage={$errors.titleSv?.at(0)}
        placeholder={m.events_title()}><Pen /></Input
      >
    {:else}
      <Input
        bind:value={$form.titleEn as string | undefined}
        id="titleEn"
        name="titleEn"
        type="text"
        aria-invalid={!!$errors.titleEn}
        aria-errormessage={$errors.titleEn?.at(0)}
        placeholder={m.events_title()}><Pen /></Input
      >
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label
      for={activeTab === "sv" ? "shortDescriptionSv" : "shortDescriptionEn"}
      >{m.events_subtitle()}</Label
    >
    {#if activeTab === "sv"}
      <Input
        bind:value={$form.shortDescriptionSv as string | undefined}
        id="shortDescriptionSv"
        name="shortDescriptionSv"
        type="text"
        aria-invalid={!!$errors.shortDescriptionSv}
        aria-errormessage={$errors.shortDescriptionSv?.at(0)}
        placeholder={m.events_subtitle()}
      />
    {:else}
      <Input
        bind:value={$form.shortDescriptionEn as string | undefined}
        id="shortDescriptionEn"
        name="shortDescriptionEn"
        type="text"
        aria-invalid={!!$errors.shortDescriptionEn}
        aria-errormessage={$errors.shortDescriptionEn?.at(0)}
        placeholder={m.events_subtitle()}
      />
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>{m.events_description()}</Label>
    {#if activeTab === "sv"}
      <Editor
        aria-invalid={!!$errors.descriptionSv}
        aria-errormessage={$errors.descriptionSv?.at(0)}
        name="descriptionSv"
        bind:value={$form.descriptionSv}
      />
    {:else}
      <Editor
        aria-invalid={!!$errors.descriptionEn}
        aria-errormessage={$errors.descriptionEn?.at(0)}
        name="descriptionEn"
        bind:value={$form.descriptionEn as string | undefined}
      />
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div class="flex flex-col gap-1.5">
      <Label for="committee">{m.events_organizer()}</Label>
      <Select.Root
        type="single"
        bind:value={() => $form.committeeId ?? NO_COMMITTEE, setCommittee}
      >
        <Select.Trigger id="committee" class="w-full">
          <Users />
          <div class="overflow-hidden text-ellipsis">{organizerLabel}</div>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={NO_COMMITTEE}
            >{m.events_noCommittee()}</Select.Item
          >
          {#each sortedCommittees as committee (committee.id)}
            <Select.Item value={committee.id}>{committee.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="location">{m.events_location()}</Label>
      <Input
        bind:value={$form.location as string | undefined}
        id="location"
        name="location"
        type="text"
        aria-invalid={!!$errors.location}
        aria-errormessage={$errors.location?.at(0)}
        placeholder={m.events_location()}><MapPin /></Input
      >
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="link">{m.events_link()}</Label>
      <Input
        bind:value={$form.link as string | undefined}
        id="link"
        name="link"
        type="url"
        aria-invalid={!!$errors.link}
        aria-errormessage={$errors.link?.at(0)}
        placeholder="https://..."><Link /></Input
      >
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>{m.events_dateTime()}</Label>
    <DateTimeSelector
      bind:fromDateTime
      bind:toDateTime
      onTimeChange={onDateTimeChange}
    />
    {#if $errors.endDatetime}
      <p class="text-destructive text-sm">{$errors.endDatetime.at(0)}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>{m.events_image()}</Label>
    {#if $form.imageUrl}
      <div class="flex flex-row items-center gap-2">
        <img
          src={$form.imageUrl}
          alt=""
          class="border-border h-16 rounded-md border"
        />
        <Button
          type="button"
          variant="ghost"
          aria-label={m.events_delete()}
          title={m.events_delete()}
          onclick={() => ($form.imageUrl = null)}><X /></Button
        >
      </div>
    {/if}
    <FileUpload
      accept="image/*"
      aria-invalid={!!$errors.image}
      bind:files={() => imageFiles,
      (files) => {
        imageFiles = files;
        $form.image = files?.item(0) ?? null;
      }}
    />
    {#if $errors.image}
      <p class="text-destructive text-sm">{$errors.image.at(0)}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="tags">{m.events_tags()}</Label>
    <TagSelector
      aria-invalid={!!$errors.tags}
      aria-errormessage={$errors.tags?._errors?.at(0)}
      name="tags"
      bind:selectedTags={$form.tags}
      {allTags}
    />
  </div>

  <div class="flex flex-col gap-3">
    <div class="flex flex-row items-center gap-2">
      <Checkbox
        id="alarmActive"
        bind:checked={() => !!$form.alarmActive,
        (checked) => ($form.alarmActive = checked)}
      />
      <Label for="alarmActive">{m.events_create_alarmActive()}</Label>
    </div>
    <div class="flex flex-row items-center gap-2">
      <Checkbox
        id="isCancelled"
        bind:checked={() => !!$form.isCancelled,
        (checked) => ($form.isCancelled = checked)}
      />
      <Label for="isCancelled">{m.events_cancelEvent()}</Label>
    </div>
    {#if $form.isCancelled}
      <p class="text-destructive text-sm">{m.events_cancellingAlert()}</p>
    {/if}
    <!-- The recurrence of an existing event cannot be changed. -->
    <div class="flex flex-row items-center gap-2">
      <Checkbox
        id="isRecurring"
        disabled={!creating}
        bind:checked={$form.isRecurring}
      />
      <Label for="isRecurring">{m.events_recurringEvent()}</Label>
    </div>
  </div>

  {#if $form.isRecurring}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-1.5">
        <Label>{m.events_create_howOften()}</Label>
        <Select.Root
          type="single"
          disabled={!creating}
          bind:value={$form.recurringType}
        >
          <Select.Trigger class="w-full">
            {recurringTypes[$form.recurringType as RecurringType]}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(recurringTypes) as [value, label] (value)}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{m.events_create_lastDate()}</Label>
        {#if creating}
          <DatePicker
            error={!!$errors.recurringEndDatetime}
            bind:value={() =>
              toCalendarDate(
                fromDate($form.recurringEndDatetime, tz),
              ).toString(),
            (newDate) => {
              const parsed = parseDate(newDate);
              // Keep the whole last day included in the recurring range.
              $form.recurringEndDatetime = new CalendarDateTime(
                parsed.year,
                parsed.month,
                parsed.day,
                23,
                59,
              ).toDate(tz);
            }}
          />
          {#if $errors.recurringEndDatetime}
            <p class="text-destructive text-sm">
              {$errors.recurringEndDatetime.at(0)}
            </p>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  <div class="flex w-full flex-row justify-between gap-2">
    <Button href={cancelHref} variant="outline">{m.cancel()}</Button>
    {#if askEditType}
      <AlertDialog.Root>
        <AlertDialog.Trigger
          type="button"
          class={buttonVariants({ class: "grow" })}
          >{m.save()}</AlertDialog.Trigger
        >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>{m.events_thisIsRecurring()}</AlertDialog.Title>
          </AlertDialog.Header>
          <RadioGroup.Root
            bind:value={() => $form.editType ?? "THIS",
            (value) => ($form.editType = value as ActionType)}
          >
            {#each editTypes as { value, label } (value)}
              <div class="flex flex-row items-center gap-2">
                <RadioGroup.Item {value} id="editType-{value}" />
                <Label for="editType-{value}">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -- static, trusted translation -->
                  {@html label}
                </Label>
              </div>
            {/each}
          </RadioGroup.Root>
          <AlertDialog.Footer>
            <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
            <!-- The dialog is portalled outside of the form -->
            <AlertDialog.Action type="submit" form={formId}
              >{m.save()}{#if $delayed}<Spinner />{/if}</AlertDialog.Action
            >
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    {:else}
      <Button type="submit" class="block grow"
        >{creating ? m.events_create() : m.save()}{#if $delayed}<Spinner
          />{/if}</Button
      >
    {/if}
  </div>
</form>
