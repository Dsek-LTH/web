<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import CommentSection from "$lib/components/socials/CommentSection.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import Event from "../Event.svelte";
  import InterestedGoingButtons from "../InterestedGoingButtons.svelte";
  import InterestedGoingList from "../InterestedGoingList.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  $: event = data.event;
</script>

<svelte:head>
  <title>{event.title} | D-sektionen</title>
</svelte:head>

<Event {event}>
  <div slot="actions">
    {#if isAuthorized(apiNames.EVENT.UPDATE, data.user)}
      <a
        class="text-primary hover:underline"
        href={`/events/${event.slug}/edit`}
      >
        Redigera
      </a>
    {/if}
    {#if data.canDelete}
      <form method="POST" action="/events/{event.slug}/delete">
        <button type="submit">
          <span class="text-primary hover:underline">Radera</span>
        </button>
      </form>
    {/if}
  </div>

  <div slot="tags" class="flex flex-row flex-wrap gap-2">
    {#each event.tags as tag}
      <TagChip {tag} />
    {/each}
  </div>

  <div slot="buttons">
    <InterestedGoingButtons
      eventId={event.id}
      interestedGoingForm={data.interestedGoingForm}
      interested={event.interested}
      going={event.going}
    />
  </div>

  <div slot="after">
    <InterestedGoingList going={event.going} interested={event.interested} />
    <div class="flex flex-col gap-2">
      <CommentSection
        type="EVENT"
        comments={event.comments}
        taggedMembers={data.allTaggedMembers}
        commentForm={data.commentForm}
        removeCommentForm={data.removeCommentForm}
      />
    </div>
  </div>
</Event>
