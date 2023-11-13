<script lang="ts">
  import DateInput from "$lib/components/DateInput.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import Event from "./Event.svelte";
  import type { EventSchema } from "./schema";

  export let data: SuperValidated<EventSchema>;
  const { form, errors, constraints, enhance, submitting } = superForm(data, {
    dataType: "json",
  });
  export let allTags: Tag[];
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
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
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Labeled id="start" label="Start" error={$errors.startDatetime}>
          <DateInput
            id="start"
            name="startDatetime"
            class="input input-bordered"
            placeholder="Start"
            bind:date={$form.startDatetime}
            error={$errors.startDatetime}
            {...$constraints.startDatetime}
          />
        </Labeled>
        <Labeled id="end" label="End" error={$errors.endDatetime}>
          <DateInput
            id="end"
            name="endDatetime"
            class="input input-bordered"
            placeholder="End"
            bind:date={$form.endDatetime}
            error={$errors.endDatetime}
            {...$constraints.endDatetime}
          />
        </Labeled>
      </div>
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
      <Labeled label="Description" id="description" error={$errors.description}>
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered min-h-[10rem]"
          placeholder="Description"
          bind:value={$form.description}
          {...$constraints.description}
        />
      </Labeled>
      <Labeled
        id="autocomplete"
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
        titleEn: "",
        descriptionEn: "",
        shortDescriptionEn: "",

        id: "",
        slug: "",
        removedAt: null,
        authorId: "",
        numberOfUpdates: 0,
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
