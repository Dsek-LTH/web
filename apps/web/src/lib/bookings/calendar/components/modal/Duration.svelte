<script lang="ts">
  import * as m from "$paraglide/messages";
  import { Clock } from "@lucide/svelte";
  import Section from "./Section.svelte";

  import dayjs from "dayjs";
  import localeData from "dayjs/plugin/localeData";

  dayjs.extend(localeData);

  const {
    startDate,
    endDate,
  }: { startDate: Temporal.ZonedDateTime; endDate: Temporal.ZonedDateTime } =
    $props();

  const dStartDate = $derived(dayjs(startDate.epochMilliseconds));
  const dEndDate = $derived(dayjs(endDate.epochMilliseconds));

  let header = $state("");
  let description = $state("");

  $effect(() => {
    const isSameDay = dStartDate.day === dEndDate.day;
    const isSameYear = dStartDate.year === dEndDate.year;

    if (isSameDay) {
      header = dStartDate.format("DD MMMM YYYY");
      description = `${dStartDate.format("HH:MM")} - ${dEndDate.format("HH:MM")}`;
    } else {
      header = isSameYear
        ? `${dStartDate.format("DD MMMM")} - ${dEndDate.format("DD MMMM YYYY")}`
        : `${dStartDate.format("DD MMMM YYYY")} - ${dEndDate.format("DD MMMM YYYY")}`;

      description = `${m.events_startTime()} ${dStartDate.format("dddd @ HH:mm")}`;
    }
  });
</script>

<Section Icon={Clock} {header} {description} />
