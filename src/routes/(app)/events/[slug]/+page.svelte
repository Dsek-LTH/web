<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import CommentSection from "$lib/components/socials/CommentSection.svelte";
  import Event from "../Event.svelte";
  import InterestedGoingButtons from "../InterestedGoingButtons.svelte";
  import InterestedGoingList from "../InterestedGoingList.svelte";

  import type { SuperValidated } from "sveltekit-superforms";
  import type { PageData } from "./$types";
  import type { RemoveArticleSchema } from "../../news/removeArticleAction";
  import { superForm } from "sveltekit-superforms/client";

  export let articleId: string;
  export let removeForm: SuperValidated<RemoveArticleSchema>;
  const { enhance } = superForm(removeForm, {
    id: articleId,
  });

  export let data: PageData;
  $: event = data.event;
</script>

<svelte:head>
  <title>{event.title} | D-sektionen</title>
</svelte:head>

<Event {event}>
  <div slot="actions" class="flex flex-row">
    {#if data.canEdit}
      <a
        href="/events/{event.slug}/edit"
        class="btn btn-square btn-ghost btn-md"
        title="Redigera"
      >
        <span class="i-mdi-edit text-xl" />
      </a>
    {/if}
    {#if data.canDelete}
      <form method="POST" action="?/removeEvent" use:enhance>
        <input type="hidden" name="eventId" value={event.id} />
        <button
          type="submit"
          class="btn btn-square btn-ghost btn-md"
          title="Radera"
        >
          <span class="i-mdi-delete text-xl" />
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
