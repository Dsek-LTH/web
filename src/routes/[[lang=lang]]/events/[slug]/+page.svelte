<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import CommentSection from "$lib/components/socials/CommentSection.svelte";
  import Event from "../Event.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  $: event = data.event;
</script>

<svelte:head>
  <title>{event.title} | D-sektionen</title>
</svelte:head>

<Event {event}>
  <div slot="actions">
    {#if data.canEdit}
      <a
        class="text-primary hover:underline"
        href={`/events/${event.slug}/edit`}
      >
        Redigera
      </a>
    {/if}
  </div>

  <div slot="tags" class="flex flex-row flex-wrap gap-2">
    {#each event.tags as tag}
      <TagChip {tag} />
    {/each}
  </div>

  <div slot="after" class="flex flex-col gap-2">
    <CommentSection
      type="EVENT"
      comments={event.comments}
      taggedMembers={data.allTaggedMembers}
      commentForm={data.commentForm}
      removeCommentForm={data.removeCommentForm}
    />
  </div>
</Event>
