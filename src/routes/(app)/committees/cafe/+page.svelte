<script lang="ts">
  import BodyContent from "../BodyContent.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import CafeTimes from "./CafeTimes.svelte";
  import type { LayoutData, PageData } from "./$types";
  import CafeBookingCalendar from "./CafeBookingCalendar.svelte";
  import dayjs from "dayjs";

  let { data }: { data: PageData & LayoutData } = $props();

  let openingHours = $derived(data.openingHours);
  let shifts = $derived(data.shifts);

  let week = $derived(
    dayjs()
      .startOf("year")
      .add(data.week - 1, "week"),
  );
</script>

<BodyContent {data} />

<div class="mb-4 flex flex-col-reverse gap-4 lg:flex-row lg:gap-0">
  <MarkdownBody
    class="text-foreground flex max-w-full flex-col gap-2 text-sm"
    body={data.markdown?.markdown ?? ""}
  />
  <CafeTimes {openingHours} />
</div>
<CafeBookingCalendar
  bind:week
  {shifts}
  user={data.user}
  ciabattaOfTheWeek={data.ciabattaOfTheWeek}
/>
