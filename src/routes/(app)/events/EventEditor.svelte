<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";

  import type { EventFormSchema } from "$lib/events/schema";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
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
    allTags: Array<ExtendedPrismaModel<"Tag">>;
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
        shortDescription: localized(
          $form.shortDescriptionSv,
          $form.shortDescriptionEn,
        ),
        description: localized($form.descriptionSv, $form.descriptionEn ?? ""),
        imageUrl: uploadedImageUrl ?? $form.imageUrl,
        location: $form.location,
        link: $form.link,
        organizer: $form.organizer,
        committee:
          committees.find(({ id }) => id === $form.committeeId) ?? null,
        startDatetime: $form.startDatetime,
        endDatetime: $form.endDatetime,
        isCancelled: $form.isCancelled,
        tags: allTags.filter((tag) => selectedTagIds.includes(tag.id)),
      }}
    />
  </section>
</div>
