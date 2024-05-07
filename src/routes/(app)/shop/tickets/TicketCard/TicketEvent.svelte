<script lang="ts">
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import dayjs from "dayjs";

  export let event: TicketWithMoreInfo["event"];
</script>

<figure class="relative aspect-video">
  <img
    src={event.imageUrl ??
      "https://minio.api.dsek.se/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp"}
    alt="{event.title} cover photo"
    class="aspect-video object-cover"
  />
  <div
    class="absolute inset-0 flex flex-col items-center justify-center bg-base-100 bg-opacity-75 transition-all group-hover:opacity-100 md:opacity-0"
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
