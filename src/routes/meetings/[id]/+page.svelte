<script lang="ts">
  import DateSpan from "$lib/components/DateSpan.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import MeetingEditor from "../MeetingEditor.svelte";
  import MeetingAgenda from "./MeetingAgenda.svelte";

  export let data;
  let isEditing = false;
  $: meeting = data.meeting;
</script>

<section class="flex flex-col gap-4">
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <PageHeader title={meeting.title} class="mb-0 mr-4" />
    </div>
    <div class="flex gap-2">
      {#if data.accessPolicies.includes(apiNames.MEETINGS.UPDATE)}
        <button
          class="btn btn-secondary btn-outline btn-sm"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? "Avbryt" : "Redigera"}
        </button>
      {/if}
    </div>
  </header>
  <DateSpan start={meeting.start} end={meeting.end} />
  <p>{meeting.description}</p>
</section>
{#if isEditing && data.accessPolicies.includes(apiNames.MEETINGS.UPDATE)}
  <MeetingEditor data={data.updateForm} action="?/update">
    <div class="mt-4 flex justify-between gap-2">
      <button type="submit" class="btn btn-secondary"> Spara </button>
      {#if data.accessPolicies.includes(apiNames.MEETINGS.DELETE)}
        <button
          type="submit"
          formaction="?/delete"
          class="btn btn-error btn-outline"
          on:click={(e) => {
            if (!confirm("Är du säker på att du vill ta bort mötet?")) {
              e.preventDefault();
            }
          }}
        >
          Ta bort
        </button>
      {/if}
    </div>
  </MeetingEditor>
{/if}
<section class="mt-8">
  <MeetingAgenda
    items={meeting.items}
    addItemsForm={data.addItemsForm}
    updateItemsForm={data.updateItemForm}
  />
</section>
