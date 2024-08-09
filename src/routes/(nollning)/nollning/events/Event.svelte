<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";

  export let event: Event;
</script>

<div
  class="collapse collapse-arrow rounded-btn border-2 border-base-200 bg-base-200 bg-transparent has-[input[type='radio']:checked]:border-base-content"
>
  <input type="radio" name="nolla-event-list" />
  <div class="collapse-title flex flex-col">
    <!-- Format date as Weekday HH:mm such as Monday 17.15 -->
    <span class="text-sm font-medium capitalize text-primary"
      >{dayjs(event.startDatetime).format("dddd HH:mm")}</span
    >
    <span class="text-base">{event.title}</span>
    <span class="text-sm font-medium text-neutral">{event.location}</span>
  </div>
  <div class="collapse-content flex flex-col">
    <p>
      <MarkdownBody body={event.description} />
    </p>
    <button class="btn-primary-dark btn mt-6 self-center"
      >Reservera biljett</button
    >
  </div>
</div>
