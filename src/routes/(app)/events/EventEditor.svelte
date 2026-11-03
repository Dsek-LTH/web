<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";

  import type { EventFormSchema } from "$lib/events/schema";
  import type { components } from "$lib/api/schema";
  import * as m from "$paraglide/messages";

  import Event, { type EventCommittee } from "./Event.svelte";
  import EventForm from "./EventForm.svelte";

  let {
    superform,
    allTags,
    committees,
    creating = false,
    isRecurringEvent = false,
    cancelHref,
  }: {
    superform: SuperForm<EventFormSchema>;
    allTags: Array<components["schemas"]["Tag"]>;
    committees: EventCommittee[];
    creating?: boolean;
    isRecurringEvent?: boolean;
    cancelHref: string;
  } = $props();

  const { form } = $derived(superform);
  let activeTab: "sv" | "en" = $state("sv");

  // Show the language that is currently being edited, falling back to Swedish
  // just like the rest of the site does for untranslated content.
  const localized = <T extends string | null>(sv: T, en: T | undefined) =>
    activeTab === "en" && en ? en : sv;

  // The image is a `File` until the event has been saved, so the preview has
  // to make its own object URL (and clean it up).
  // Derived on its own so that the effect only re-runs when the file changes,
  // not on every keystroke in the form.
  const image = $derived($form.image);
  let uploadedImageUrl: string | null = $state(null);
  $effect(() => {
    if (!image) {
      uploadedImageUrl = null;
      return;
    }
    const url = URL.createObjectURL(image);
    uploadedImageUrl = url;
    return () => URL.revokeObjectURL(url);
  });

  const selectedTagIds = $derived($form.tags.map((tag) => tag.id));
</script>

<div class="flex flex-col gap-8 lg:flex-row lg:*:w-1/2">
  <EventForm
    bind:activeTab
    {superform}
    {allTags}
    {committees}
    {creating}
    {isRecurringEvent}
    {cancelHref}
  />
  <section class="flex flex-col gap-2">
    <span class="text-muted-foreground italic">{m.events_create_preview()}</span
    >
    <Event
      event={{
        title: localized($form.titleSv, $form.titleEn ?? undefined),
        shortDescription:
          localized($form.shortDescriptionSv, $form.shortDescriptionEn) ??
          undefined,
        description: localized($form.descriptionSv, $form.descriptionEn ?? ""),
        imageUrl: uploadedImageUrl ?? $form.imageUrl ?? undefined,
        location: $form.location ?? undefined,
        link: $form.link ?? undefined,
        organizer: $form.organizer,
        committee: committees.find(({ id }) => id === $form.committeeId),
        startAt: $form.startDatetime,
        endAt: $form.endDatetime,
        isCancelled: $form.isCancelled ?? undefined,
        tags: allTags.filter((tag) => selectedTagIds.includes(tag.id)),
      }}
    />
  </section>
</div>
