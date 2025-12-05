<script>
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import NotImplemented from "$lib/components/NotImplemented.svelte";
  import { Button } from "$lib/components/ui/button/index";
  const { data } = $props();
</script>

<div class="flex flex-col items-center justify-between pb-10 lg:flex-row">
  <h1 class="pb-4 font-sans">Hej, {data.member?.firstName}!</h1>
  <div class="flex flex-col gap-4 lg:flex-row">
    <a
      href="bit.ly/trivselkontakt"
      class="hover:bg-secondary-hover bg-muted-background flex flex-col rounded-md p-4 text-center"
    >
      <div class="text-muted-foreground">{data.wellbeing}</div>
      <div class="font-semibold">Kontakta trivselrådet</div>
    </a>
    <a
      href="bit.ly/trivselkontakt"
      class="hover:bg-secondary-hover bg-muted-background flex flex-col rounded-md p-4 text-center"
    >
      <div class="text-muted-foreground">Åsikter om utbildningen?</div>
      <div class="font-semibold">Kontakta studierådet</div>
    </a>
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
