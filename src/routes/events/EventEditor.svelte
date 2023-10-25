<script lang="ts">
  import { enhance } from "$app/forms";
  import DateInput from "$lib/components/DateInput.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Event as EventType, Member, Tag } from "@prisma/client";
  import Event from "./Event.svelte";

  export let allTags: Tag[];
  export let selectedTags: Tag[] = [];
  export let author: Member;
  export let event: EventType = {
    title: "",
    titleEn: "",
    description: "",
    descriptionEn: "",
    shortDescription: "",
    shortDescriptionEn: "",
    startDatetime: new Date(),
    endDatetime: new Date(),
    link: null,
    location: null,
    organizer: `${author.firstName} ${author.lastName}`,
    alarmActive: false,

    id: "",
    slug: "",
    removedAt: null,
    authorId: "",
    numberOfUpdates: 0,
  };
  let submitting: boolean = false;

  export let formData: Record<string, any> | undefined;
  // effect over default value above to work from for "edit article" as well
  $: (() => {
    if (!formData) return;
    event = {
      ...event,
      ...formData,
    };
    if (formData.startDatetime) event.startDatetime = new Date(formData.startDatetime);
    if (formData.endDatetime) event.endDatetime = new Date(formData.endDatetime);
    if (formData.tags) {
      const oldTagIds = JSON.parse(formData.tags).map((tag: Tag) => tag.id);
      selectedTags = allTags.filter((tag) => oldTagIds.includes(tag.id));
    }
    formData = undefined; // to stop formData from overriding what user changes
  })();
</script>

<main class="flex w-screen flex-col gap-8 px-4 pt-8 lg:flex-row lg:px-8 [&>*]:flex-1">
  <section>
    <form method="POST" class="form-control gap-2" use:enhance>
      <slot name="form-start" />
      <Input label="Title" bind:value={event.title} name="title" />
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Labeled id="start" label="Start">
          <DateInput
            id="start"
            name="startDatetime"
            class="input input-bordered"
            placeholder="Start"
            required
            bind:date={event.startDatetime}
          />
        </Labeled>
        <Labeled id="end" label="End">
          <DateInput
            id="end"
            name="endDatetime"
            class="input input-bordered"
            placeholder="End"
            required
            bind:date={event.endDatetime}
          />
        </Labeled>
      </div>
      <div class="flex flex-row justify-between gap-4 [&>*]:flex-1">
        <Input label="Organizer" required bind:value={event.organizer} name="organizer" />
        <Input label="Location" required bind:value={event.location} name="location" />
        <Input label="Link" required bind:value={event.link} name="link" />
      </div>
      <Input
        label="Short description"
        bind:value={event.shortDescription}
        name="shortDescription"
      />
      <Labeled label="Description" id="description">
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered min-h-[10rem]"
          placeholder="Description"
          bind:value={event.description}
        />
      </Labeled>
      <Labeled id="autocomplete" label="Taggar">
        <TagSelector {allTags} bind:selectedTags />
      </Labeled>
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
      <slot name="form-end" />
      <!-- <button type="submit" disabled style="display: none" aria-hidden="true" /> -->
      <button type="submit" disabled={submitting} class="btn btn-primary mt-4">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    <slot name="error" />
  </section>
  <section>
    <span class="italic">Preview</span>
    {#if event != null}
      <Event {event}>
        <div slot="tags" class="flex flex-row flex-wrap gap-2">
          {#each selectedTags as tag}
            <TagChip {tag} />
          {/each}
        </div>
      </Event>
    {/if}
  </section>
</main>
