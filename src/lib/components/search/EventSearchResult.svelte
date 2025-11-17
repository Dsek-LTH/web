<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import type { EventSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";
  const { data }: { data: EventSearchReturnAttributes } = $props();
  import MapPin from "@lucide/svelte/icons/map-pin";
  import dayjs from "dayjs";
  const dayjsStartDateTime = dayjs(data.startDatetime);
</script>

<Command.LinkItem
  class="flex w-full flex-row justify-between"
  href={`/events/${data.slug}`}
  data-search-result
>
  <div class="flex w-full flex-row items-center justify-between gap-2">
    <div class="flex flex-col">
      <span class="font-medium"
        >{languageTag() === "sv" ? data.titleSv : data.titleEn}</span
      >

      <div class="flex flex-row items-center gap-1">
        <MapPin size="16" class="max-h-4 max-w-4" />
        <span class="text-muted-foreground">
          {data.location}
        </span>
      </div>
    </div>
    <div class="text-muted-foreground flex flex-col text-right">
      {dayjsStartDateTime.format("YYYY-MM-DD")}
      <div>
        {`${dayjsStartDateTime.format("hh:mm")} - ${dayjs(
          data.endDatetime,
        ).format("hh:mm")}`}
      </div>
    </div>
  </div>
</Command.LinkItem>
