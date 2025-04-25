<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import { getFileUrl } from "$lib/files/client";
  import * as m from "$paraglide/messages";
  interface Props {
    event: Pick<
      Event,
      | "title"
      | "startDatetime"
      | "endDatetime"
      | "shortDescription"
      | "description"
      | "imageUrl"
      | "isCancelled"
      | "location"
      | "link"
    > &
      Partial<Pick<Event, "removedAt">>;
    actions?: import("svelte").Snippet;
    buttons?: import("svelte").Snippet;
    tags?: import("svelte").Snippet;
    after?: import("svelte").Snippet;
  }

  let { event, actions, buttons, tags, after }: Props = $props();
</script>

{#if event.imageUrl}
  <figure>
    <img class="mx-auto" src={getFileUrl(event.imageUrl)} alt={event.title} />
  </figure>
{/if}

<div class="flex items-baseline">
  <h1 class="text-2xl font-bold" class:line-through={event.isCancelled}>
    {event.title}
    {#if event.removedAt}
      <span
        class="badge badge-error badge-sm relative -top-1 !text-xs font-semibold"
        >Raderat</span
      >
    {/if}
  </h1>
  {#if event.isCancelled}
    <span class="badge badge-error badge-lg relative -top-1 ml-2 font-semibold"
      >{m.events_cancelled()}</span
    >
  {/if}
</div>

<section
  class="flex flex-row justify-between"
  class:line-through={event.isCancelled}
>
  <DateSpan start={event.startDatetime} end={event.endDatetime} />
  {@render actions?.()}
</section>
{#if event.location}
  <section class="my-2">
    <div class="flex items-center gap-2 text-primary">
      <span class="i-mdi-map-marker text-lg"></span>
      <p class="text-base leading-none">{event.location}</p>
    </div>
  </section>
{/if}
{#if event.link}
  <section class="my-2">
    <div class="flex items-center gap-2 text-primary">
      <span class="i-mdi-link text-lg"></span>
      <a
        href={event.link}
        class="text-base leading-none hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {m.events_link()}
      </a>
    </div>
  </section>
{/if}

{@render buttons?.()}

<section class="my-2 flex flex-row items-center justify-between">
  {@render tags?.()}
</section>

{#if event.shortDescription}
  <MarkdownBody
    body={event.shortDescription}
    class="mb-4 text-xl font-semibold !leading-snug"
  />
{/if}
<MarkdownBody body={event.description} />

{@render after?.()}
