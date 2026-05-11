<script lang="ts">
  import EventCard from "$lib/components/EventCard.svelte";
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import NotImplemented from "$lib/components/NotImplemented.svelte";
  import * as ButtonGroup from "$lib/components/ui/button-group/index";
  import Button from "$lib/components/ui/button/button.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import * as messages from "$paraglide/messages";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  const { data } = $props();

  type CalendarKind = "week" | "month" | "list";

  const calendarKind = $derived(
    page.url.searchParams.get("calendarKind") ?? "week",
  );

  const setCalendarKind = (kind: CalendarKind) => {
    const url = new URL(page.url);
    url.searchParams.set("calendarKind", kind);
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- we use `page.url`
    goto(url);
  };

  const kindSelectorVariant = (buttonKind: CalendarKind) =>
    calendarKind == buttonKind ? "rosa" : "outline";
</script>

<div class="flex w-full flex-row justify-between">
  <Button>
    {messages.events_createEvent()}
  </Button>

  <ButtonGroup.Root>
    <Button
      variant={kindSelectorVariant("week")}
      onclick={() => setCalendarKind("week")}
      >{messages.events_calendar_week()}</Button
    >
    <Button
      variant={kindSelectorVariant("month")}
      onclick={() => setCalendarKind("month")}
      >{messages.events_calendar_month("month")}</Button
    >
    <Button
      variant={kindSelectorVariant("list")}
      onclick={() => setCalendarKind("list")}
      >{messages.events_calendar_list("list")}</Button
    >
  </ButtonGroup.Root>
</div>

{#if calendarKind === "week"}
  <HomeCalendar
    events={data.events.map((event) => ({
      startDate: event.startDatetime,
      endDate: event.endDatetime,
      slug: event.slug ?? "",
      title: event.title,
    }))}
  />
{:else if calendarKind === "month"}
  <!-- TODO: Implement this when the month calendar gets added. -->
  <NotImplemented />
{:else}
  <div class="flex flex-col gap-2 pt-2">
    {#each data.events as event, index (event.id)}
      <EventCard {event} {index} />
    {/each}

    <Pagination pageCount={data.pageCount} />
  </div>
{/if}
