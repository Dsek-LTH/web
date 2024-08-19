<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormDateInput from "$lib/components/forms/FormDateInput.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import { type EventSchema } from "$lib/events/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import { recurringTypes } from "$lib/utils/events";
  import * as m from "$paraglide/messages";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import Event from "./Event.svelte";
  import LangTabs from "$lib/components/layout/LangTabs.svelte";
  import FormFileInput from "$lib/components/forms/FormFileInput.svelte";
  import FormMarkdown from "$lib/components/forms/FormMarkdown.svelte";

  export let creating = false;
  export let data: SuperValidated<EventSchema>;
  const superform = superForm(data, {
    dataType: "json",
  });
  const { form, errors, enhance } = superform;
  export let allTags: Tag[];
  $: console.log(Object.keys(recurringTypes));
  let activeTab: "sv" | "en";
</script>

<main
  class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1"
>
  <section>
    <form method="POST" class="form-control items-start gap-2" use:enhance>
      <slot name="form-start" />
      <LangTabs bind:activeTab class="self-stretch">
        <svelte:fragment slot="sv">
          <FormInput {superform} label={m.events_title()} field="title" />
          <FormInput
            {superform}
            label={m.events_subtitle()}
            field="shortDescription"
          />
          <FormMarkdown
            {superform}
            label={m.events_description()}
            field="description"
            class="min-h-[10rem]"
            placeholder={m.events_description()}
          /></svelte:fragment
        >
        <svelte:fragment slot="en">
          <FormInput {superform} label={m.events_title()} field="titleEn" />
          <FormInput
            {superform}
            label={m.events_subtitle()}
            field="shortDescriptionEn"
          />
          <FormMarkdown
            {superform}
            label={m.events_description()}
            field="descriptionEn"
            class="min-h-[10rem]"
            placeholder={m.events_description()}
          />
        </svelte:fragment>
      </LangTabs>
      <div
        class="flex flex-row justify-between gap-4 self-stretch [&>*]:flex-1"
      >
        <FormInput {superform} label={m.events_organizer()} field="organizer" />
        <FormInput {superform} label={m.events_location()} field="location" />
        <FormInput {superform} label={m.events_link()} field="link" />
      </div>
      <div
        class="flex flex-row justify-between gap-4 self-stretch [&>*]:flex-1"
      >
        <FormDateInput
          {superform}
          label={m.events_startTime()}
          placeholder={m.events_startTime()}
          field="startDatetime"
        />
        <FormDateInput
          {superform}
          label={m.events_endTime()}
          placeholder={m.events_endTime()}
          field="endDatetime"
        />
      </div>

      <FormFileInput {superform} field="image" label="Bild" />

      <FormCheckbox
        {superform}
        field="alarmActive"
        label="{m.events_create_alarmActive()}}"
      />
      <FormCheckbox
        {superform}
        field="isRecurring"
        disabled={!creating}
        label="{m.events_recurringEvent()}}"
      />
      {#if $form.isRecurring}
        <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
          <FormSelect
            fullWidth
            options={Object.entries(recurringTypes).map((type) => ({
              label: type[1],
              value: type[0],
            }))}
            {superform}
            field="recurringType"
            label={m.events_create_howOften()}
            disabled={!creating}
          />
          <FormDateInput
            {superform}
            label={m.events_create_lastDate()}
            field="recurringEndDatetime"
            disabled={!creating}
            onlyDate
          />
        </div>
      {/if}

      <div class="flex w-full flex-col items-stretch">
        <Labeled
          for="tags"
          label={m.events_tags()}
          error={$errors.tags?._errors?.join(", ")}
        />
        <TagSelector name="tags" {allTags} bind:selectedTags={$form.tags} />
      </div>
      <slot name="form-end" />
      <FormSubmitButton {superform} class="btn btn-primary mt-4">
        {creating ? m.save() : m.news_publish()}
      </FormSubmitButton>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">{m.events_create_preview()}</span>
    <Event
      event={{
        ...$form,
        title:
          activeTab === "en" && $form.titleEn ? $form.titleEn : $form.title,
        shortDescription:
          activeTab === "en" && $form.shortDescriptionEn
            ? $form.shortDescriptionEn
            : $form.shortDescription,
        description:
          activeTab === "en" && $form.descriptionEn
            ? $form.descriptionEn
            : $form.description,
        imageUrl: $form.image
          ? URL.createObjectURL($form.image)
          : ($form.imageUrl ?? null),
      }}
    >
      <div slot="tags" class="flex flex-row flex-wrap gap-2">
        {#each $form.tags as selectedTag}
          {@const tag = allTags.find((t) => t.id === selectedTag.id)}
          <TagChip {tag} />
        {/each}
      </div>
    </Event>
  </section>
</main>
