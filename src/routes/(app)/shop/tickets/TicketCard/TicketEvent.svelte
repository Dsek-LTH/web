<script lang="ts">
  import dayjs from "dayjs";
  import type { TicketWithEvent } from "../types";

  export let event: TicketWithEvent["event"];
</script>

<a href="/events/{event.slug}">
  <figure class="relative">
    <img
      src={event.imageUrl}
      alt="{event.title} cover photo"
      class="aspect-video object-cover"
    />
    <div
      class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 transition-all group-hover:opacity-100 md:opacity-0"
    >
      <h6 class="text-xl font-semibold">{event.title}</h6>
      <h6 class="-mt-1 text-sm opacity-80">
        {dayjs(event.startDatetime).format("dddd Do MMM")}
      </h6>
      <h6 class="">{event.shortDescription}</h6>

      <h6 class="absolute left-4 top-4">{event.organizer}</h6>
      <h6 class="absolute right-4 top-4">{event.location}</h6>
    </div>
  </figure>
</a>
