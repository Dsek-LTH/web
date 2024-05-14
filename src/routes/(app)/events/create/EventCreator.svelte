<script lang="ts">
  import DateInput from "$lib/components/DateInput.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { dateProxy, superForm } from "sveltekit-superforms/client";
  import Event from "../Event.svelte";
  import { type EventSchema } from "../schema";
  import { recurringTypes } from "$lib/utils/events";

  export let data: SuperValidated<EventSchema>;
  const { form, errors, constraints, enhance, submitting } = superForm(data, {
    dataType: "json",
  });
  const recurringEndDateProxy = dateProxy(form, "recurringEndDatetime", {
    format: "date",
  });
  export let allTags: Tag[];
</script>

<main
  class="container mx-auto flex flex-col gap-8 px-4 pt-8 lg:flex-row [&>*]:flex-1"
>
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input
        label="Title"
        name="title"
        bind:value={$form.title}
        error={$errors.title}
        {...$constraints.title}
      />
      <Input
        label="Subtitle"
        name="shortDescription"
        bind:value={$form.shortDescription}
        error={$errors.shortDescription}
        {...$constraints.shortDescription}
      />
      <Labeled label="Description" error={$errors.description}>
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered min-h-[10rem]"
          placeholder="Description"
          bind:value={$form.description}
          {...$constraints.description}
        />
      </Labeled>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Input
          label="Organizer"
          required
          name="organizer"
          bind:value={$form.organizer}
          error={$errors.organizer}
          {...$constraints.organizer}
        />
        <Input
          label="Location"
          required
          name="location"
          bind:value={$form.location}
          error={$errors.location}
          {...$constraints.location}
        />
        <Input
          label="Link"
          required
          name="link"
          bind:value={$form.link}
          error={$errors.link}
          {...$constraints.link}
        />
      </div>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Labeled label="Start" error={$errors.startDatetime}>
          <DateInput
            id="start"
            name="startDatetime"
            placeholder="Start"
            bind:date={$form.startDatetime}
            error={$errors.startDatetime}
            {...$constraints.startDatetime}
          />
        </Labeled>
        <Labeled label="End" error={$errors.endDatetime}>
          <DateInput
            id="end"
            name="endDatetime"
            placeholder="End"
            bind:date={$form.endDatetime}
            error={$errors.endDatetime}
            {...$constraints.endDatetime}
          />
        </Labeled>
      </div>
      <div class="flex items-center pt-4">
        Larm aktivt under eventet
        <input
          type="checkbox"
          class="checkbox mx-4"
          bind:checked={$form.alarmActive}
        />
      </div>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <label class="label cursor-pointer">
          <span class="label-text">Återkommande event</span>
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={$form.isRecurring}
          />
        </label>
        <Labeled label="Hur ofta?" error={$errors.recurringType} fullWidth>
          <select
            id="classProgramme"
            name="classProgramme"
            class="select select-bordered"
            disabled={!$form.isRecurring}
            bind:value={$form.recurringType}
            {...$constraints.recurringType}
          >
            {#each recurringTypes as type}
              <option value={type[0]}>{type[1]}</option>
            {/each}
          </select>
        </Labeled>
        <Labeled label="Sista datum" error={$errors.recurringEndDatetime}>
          <input
            type="date"
            disabled={!$form.isRecurring}
            class="input input-bordered"
            bind:value={$recurringEndDateProxy}
            {...$constraints.recurringEndDatetime}
          />
        </Labeled>
      </div>
      <Labeled
        label="Taggar"
        error={$errors.tags !== undefined ? "Ogiltiga taggar" : ""}
      >
        <TagSelector {allTags} bind:selectedTags={$form.tags} />
      </Labeled>
      <slot name="form-end" />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={$submitting} class="btn btn-primary mt-4">
        {$submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">Preview</span>
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
