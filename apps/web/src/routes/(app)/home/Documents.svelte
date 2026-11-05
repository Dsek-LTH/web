<script lang="ts">
  import type { BoardMeetingFiles } from "$lib/server/loadHomeData";
  import * as m from "$paraglide/messages";
  import FileLink from "$lib/components/files/FileLink.svelte";

  let {
    meetings,
  }: {
    meetings: {
      next: BoardMeetingFiles | undefined;
      last: BoardMeetingFiles | undefined;
    };
  } = $props();
</script>

{#snippet meetingCard(meeting: BoardMeetingFiles, label: string)}
  <div class="flex flex-col rounded-md border-[1px] p-4">
    <div class="flex flex-row items-baseline">
      <h4>
        <a
          href="/documents"
          class="hover:text-muted-foreground transition-colors"
        >
          {meeting.name}
        </a>
      </h4>
      <h6>&nbsp;- {label}</h6>
    </div>
    <div class="flex flex-col">
      {#each meeting.files as file (file.id)}
        <FileLink
          class="px-2 *:shrink-0"
          name={file.name}
          url={file.url}
          full
        />
      {/each}
    </div>
  </div>
{/snippet}

<div class="max-w-full md:max-w-1/2">
  <h2 class="mb-2">
    <a href="/documents" class="hover:text-muted-foreground transition-colors"
      >{m.documents_boardMeetings()}</a
    >
  </h2>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {#if meetings.next}
      {@render meetingCard(meetings.next, m.home_meetingNext())}
    {/if}
    {#if meetings.last}
      {@render meetingCard(meetings.last, m.home_meetingPrev())}
    {/if}
  </div>
</div>
