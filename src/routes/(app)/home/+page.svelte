<script lang="ts">
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  const { data } = $props();
</script>

<div class="flex flex-col items-center justify-between pb-10 md:flex-row">
  <div class="flex flex-row items-center justify-between">
    <h1 class="pb-4 font-sans whitespace-nowrap">
      Hej, {data.member?.firstName}!
    </h1>
  </div>
</div>

<h3>Event</h3>
<HomeCalendar
  events={data.events.map((e) => ({
    startDate: e.startDatetime,
    endDate: e.endDatetime,
    slug: e.slug ?? "",
    title: e.title,
  }))}
/>
