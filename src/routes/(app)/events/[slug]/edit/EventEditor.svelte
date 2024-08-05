<script lang="ts">
  import DateInput from "$lib/components/DateInput.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import { type EventSchema } from "../../schema";
  import Event from "../../Event.svelte";
  import { recurringTypes } from "$lib/utils/events";
  import * as m from "$paraglide/messages";

  export let data: SuperValidated<EventSchema>;
  const { form, errors, constraints, enhance, submitting } = superForm(data, {
    dataType: "json",
  });
  export let allTags: Tag[];
</script>

<main
  class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1"
>
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input
        label={m.events_title()}
        name="title"
        bind:value={$form.title}
        error={$errors.title}
        {...$constraints.title}
      />
      <Input
        label={m.events_subtitle()}
        name="shortDescription"
        bind:value={$form.shortDescription}
        error={$errors.shortDescription}
        {...$constraints.shortDescription}
      />
      <Labeled label="Description" error={$errors.description}>
        <textarea
          id={m.events_subtitle()}
          name="description"
          class="textarea textarea-bordered min-h-[10rem]"
          placeholder={m.events_subtitle()}
          bind:value={$form.description}
          {...$constraints.description}
        />
      </Labeled>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Input
          label={m.events_organizer()}
          required
          name="organizer"
          bind:value={$form.organizer}
          error={$errors.organizer}
          {...$constraints.organizer}
        />
        <Input
          label={m.events_location()}
          required
          name="location"
          bind:value={$form.location}
          error={$errors.location}
          {...$constraints.location}
        />
        <Input
          label={m.events_link()}
          name="link"
          bind:value={$form.link}
          error={$errors.link}
          {...$constraints.link}
        />
      </div>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Labeled label={m.events_startTime()} error={$errors.startDatetime}>
          <DateInput
            id="start"
            name="startDatetime"
            placeholder={m.events_startTime()}
            bind:date={$form.startDatetime}
            error={$errors.startDatetime}
            {...$constraints.startDatetime}
          />
        </Labeled>
        <Labeled label={m.events_endTime()} error={$errors.endDatetime}>
          <DateInput
            id="end"
            name="endDatetime"
            placeholder={m.events_endTime()}
            bind:date={$form.endDatetime}
            error={$errors.endDatetime}
            {...$constraints.endDatetime}
          />
        </Labeled>
      </div>
      <div class="flex items-center pt-4">
        {m.events_create_alarmActive()}
        <input
          type="checkbox"
          class="checkbox mx-4"
          bind:checked={$form.alarmActive}
        />
      </div>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <label class="label cursor-pointer">
          <span class="label-text">{m.events_recurringEvent()}</span>
          <input
            type="checkbox"
            class="checkbox"
            disabled={true}
            bind:checked={$form.isRecurring}
          />
        </label>
        <Labeled
          label={m.events_create_howOften()}
          error={$errors.recurringType}
          fullWidth
        >
          <select
            id="recurringTypeSelect"
            name="recurringType"
            class="select select-bordered"
            disabled={true}
            bind:value={$form.recurringType}
            {...$constraints.recurringType}
          >
            {#each recurringTypes as type}
              <option value={type[0]}>{type[1]}</option>
            {/each}
          </select>
        </Labeled>
        <Labeled
          label={m.events_create_howOften()}
          error={$errors.recurringEndDatetime}
        >
          <input
            type="date"
            disabled={true}
            class="input input-bordered"
            bind:value={$form.recurringEndDatetime}
            {...$constraints.recurringEndDatetime}
          />
        </Labeled>
      </div>
      <Labeled
        label={m.events_tags()}
        error={$errors.tags !== undefined ? m.events_create_invalidTags() : ""}
      >
        <TagSelector {allTags} bind:selectedTags={$form.tags} />
      </Labeled>
      <slot name="form-end" />
      <button type="submit" disabled={$submitting} class="btn btn-primary mt-4">
        {$submitting ? m.events_create_submitting() : m.events_create_submit()}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">{m.events_create_preview()}</span>
    <Event
      event={{
        ...$form,
      }}
    >
      <div slot="tags" class="flex flex-row flex-wrap gap-2">
        {#each $form.tags as tag}
          <TagChip {tag} />
        {/each}
      </div>
    </Event>
  </section>
</main>
