<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import CommentSection from "$lib/components/socials/CommentSection.svelte";
  import * as m from "$paraglide/messages";
  import Event from "../Event.svelte";
  import InterestedGoingButtons from "../InterestedGoingButtons.svelte";
  import InterestedGoingList from "../InterestedGoingList.svelte";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";

  export let articleId: string;

  export let data: PageData;
  const { enhance, form } = superForm(data.removeEventForm, {
    id: articleId,
  });
  $: event = data.event;
  let isModalOpen = false;
  let submitString: "submit" | "button";
  $: submitString = event.recurringParentId != undefined ? "button" : "submit";
</script>

<SetPageTitle title={event.title} />

<Event {event}>
  <div slot="actions" class="flex flex-row">
    {#if data.canEdit}
      <a
        href="/events/{event.slug}/edit"
        class="btn btn-square btn-ghost btn-md"
        title={m.events_edit()}
      >
        <span class="i-mdi-edit text-xl" />
      </a>
    {/if}
    {#if data.canDelete}
      <form method="POST" action="?/removeEvent" use:enhance>
        <input type="hidden" name="eventId" value={event.id} />
        <button
          type={submitString}
          class="btn btn-square btn-ghost btn-md"
          title="Radera"
          on:click={() =>
            (isModalOpen = event.recurringParentId !== null && true)}
        >
          <span class="i-mdi-delete text-xl" />
        </button>
        <button
          class="modal hover:cursor-default"
          type="button"
          class:modal-open={isModalOpen}
          on:click|self={() => (isModalOpen = false)}
        >
          <div class="modal-box">
            <h3 class="text-lg font-bold">{m.events_thisIsRecurring()}</h3>
            <div class="py-4">
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html m.events_deleteThisEvent()}
                  </span>
                  <input
                    type="radio"
                    name="removeAll"
                    class="radio"
                    bind:group={$form.removeAll}
                    value={false}
                  />
                </label>
              </div>
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html m.events_deleteAllEvents()}
                  </span>
                  <input
                    type="radio"
                    name="removeAll"
                    class="radio"
                    bind:group={$form.removeAll}
                    value={true}
                  />
                </label>
              </div>
            </div>
            <div class="modal-action">
              <button
                class="btn btn-error"
                type="submit"
                on:click={() => (isModalOpen = false)}
              >
                {m.events_delete()}
              </button>
            </div>
          </div>
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
