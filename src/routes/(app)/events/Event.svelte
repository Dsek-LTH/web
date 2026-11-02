<script lang="ts" module>
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export type EventCommittee = Pick<
    ExtendedPrismaModel<"Committee">,
    "id" | "name" | "shortName" | "symbolUrl"
  >;

  export type EventView = {
    title: string;
    shortDescription: string | null;
    description: string;
    imageUrl: string | null | undefined;
    location: string | null;
    link: string | null;
    /** The old free text organizer, only shown for events without a committee. */
    organizer: string;
    committee: EventCommittee | null;
    startDatetime: Date;
    endDatetime: Date;
    isCancelled: boolean | null;
    tags: Array<ExtendedPrismaModel<"Tag">>;
  };
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import dayjs from "dayjs";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import * as m from "$paraglide/messages";

  import Calendar from "@lucide/svelte/icons/calendar";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import Users from "@lucide/svelte/icons/users";

  let {
    event,
    actions,
    buttons,
    after,
  }: {
    event: EventView;
    /** Edit/delete/etc. buttons shown next to the title. */
    actions?: Snippet;
    /** Shown between the event details and the description. */
    buttons?: Snippet;
    /** Shown below the description. */
    after?: Snippet;
  } = $props();

  const start = $derived(dayjs(event.startDatetime));
  const end = $derived(dayjs(event.endDatetime));
  const sameDay = $derived(start.isSame(end, "day"));
  const hasOrganizer = $derived(!!event.committee || !!event.organizer);

  // Links are user-provided, so never render anything but http(s) as a link.
  const safeLink = $derived(
    event.link && /^https?:\/\//i.test(event.link) ? event.link : null,
  );
</script>

<article class="flex flex-col gap-2">
  {#if event.imageUrl}
    <img
      src={event.imageUrl}
      alt=""
      class="border-border aspect-[2/1] w-full rounded-xl border object-cover"
    />
  {/if}

  <div class="flex flex-row justify-between gap-2">
    <div class="flex flex-col gap-1">
      <div class="flex flex-row flex-wrap items-center gap-2">
        <h2 class:line-through={event.isCancelled}>{event.title}</h2>
        {#if event.isCancelled}
          <Badge variant="outline" class="border-destructive text-destructive">
            {m.events_cancelled()}
          </Badge>
        {/if}
      </div>
      {#if event.shortDescription}
        <p class="text-muted-foreground mt-0">{event.shortDescription}</p>
      {/if}
    </div>
    {#if actions}
      <div class="flex flex-row gap-2">{@render actions()}</div>
    {/if}
  </div>

  {#if hasOrganizer}
    <div class="flex flex-row items-center">
      {#if event.committee}
        {#if event.committee.shortName}
          <a
            href="/committees/{event.committee.shortName}"
            class="flex flex-row items-center gap-2 transition-opacity hover:opacity-80"
            title={m.events_organizer()}
          >
            {@render committee(event.committee)}
          </a>
        {:else}
          <div
            class="flex flex-row items-center gap-2"
            title={m.events_organizer()}
          >
            {@render committee(event.committee)}
          </div>
        {/if}
      {:else if event.organizer}
        <span
          class="flex flex-row items-center gap-2 font-medium"
          title={m.events_organizer()}
        >
          <Users class="text-muted-foreground size-4 shrink-0" />
          {event.organizer}
        </span>
      {/if}
    </div>
  {/if}
  {#if event.tags.length > 0}
    <div class="flex flex-row flex-wrap gap-2">
      {#each event.tags as tag (tag.id)}
        <TagChip {tag} />
      {/each}
    </div>
  {/if}

  <div class="my-2 flex flex-col gap-2" class:opacity-60={event.isCancelled}>
    <div class="flex flex-row items-center gap-2">
      <Calendar class="text-muted-foreground size-4 shrink-0" />
      <span class:line-through={event.isCancelled}>
        {#if sameDay}
          {start.format("dddd D MMMM YYYY")}, {start.format("HH:mm")} – {end.format(
            "HH:mm",
          )}
        {:else}
          {start.format("ddd D MMM YYYY, HH:mm")} – {end.format(
            "ddd D MMM YYYY, HH:mm",
          )}
        {/if}
      </span>
    </div>
    {#if event.location}
      <div class="flex flex-row items-center gap-2">
        <MapPin class="text-muted-foreground size-4 shrink-0" />
        <span>{event.location}</span>
      </div>
    {/if}
    {#if safeLink}
      <div class="flex flex-row items-center gap-2">
        <ExternalLink class="text-muted-foreground size-4 shrink-0" />
        <a
          href={safeLink}
          target="_blank"
          rel="noopener noreferrer"
          class="text-rosa-background break-all hover:underline"
        >
          {safeLink}
        </a>
      </div>
    {/if}
  </div>

  {@render buttons?.()}

  {#if event.description}
    <MarkdownBody class="text-foreground max-w-none" body={event.description} />
  {/if}

  {@render after?.()}
</article>

{#snippet committee(committee: EventCommittee)}
  <CommitteeSymbol {committee} />
  <span class="font-medium">{committee.name}</span>
{/snippet}
