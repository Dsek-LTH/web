<script lang="ts">
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";

  export let event: Event;
</script>

<div class="flex items-center gap-3">
  <div class="avatar">
    <div class="mask mask-squircle h-12 w-12">
      <img
        src={event.imageUrl ??
          "https://minio.api.dsek.se/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp"}
        alt="{event.title} event photo"
      />
    </div>
  </div>
  <div>
    <div class="font-bold">{event.title}</div>
    <div class="text-sm opacity-50">
      {dayjs(event.startDatetime).format("DD/MM")}
    </div>
    <slot />
  </div>
</div>
