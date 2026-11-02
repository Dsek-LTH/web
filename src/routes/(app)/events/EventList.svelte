<script lang="ts">
  import dayjs from "dayjs";

  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import EventCard from "$lib/components/EventCard.svelte";
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import NotImplemented from "$lib/components/NotImplemented.svelte";
  import * as ButtonGroup from "$lib/components/ui/button-group/index";
  import Button from "$lib/components/ui/button/button.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import * as messages from "$paraglide/messages";

  import EventFilters from "./EventFilters.svelte";
  import type { Display, EventPageLoadData } from "./EventPageLoad.js";

  const { data }: { data: EventPageLoadData } = $props();

  const display = $derived(data.display);

  const setCalendarKind = (display: Display) => {
    const url = new URL(page.url);
    url.searchParams.set("display", display);
    url.searchParams.delete("page");
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- we use `page.url`
    goto(url);
  };

  const kindSelectorVariant = (buttonKind: Display) =>
    display === buttonKind ? "rosa" : "outline";

  let eventPairs = $derived(
    data.events.map((event, index) => ({
      last: index === 0 ? null : data.events[index - 1]!,
      event,
    })),
  );
</script>

<SetPageTitle title={messages.events()} />

<div class="flex flex-col gap-4">
  <div class="flex w-full flex-row flex-wrap justify-between gap-2">
    {#if page.data.member}
      <Button href={resolve("/events/create")}>
        {messages.events_createEvent()}
      </Button>
    {:else}
      <div></div>
    {/if}

    <ButtonGroup.Root>
      <Button
        variant={kindSelectorVariant("week")}
        onclick={() => setCalendarKind("week")}
        >{messages.events_calendar_week()}</Button
      >
      <Button
        variant={kindSelectorVariant("month")}
        onclick={() => setCalendarKind("month")}
        >{messages.events_calendar_month()}</Button
      >
      <Button
        variant={kindSelectorVariant("upcoming")}
        onclick={() => setCalendarKind("upcoming")}
        >{messages.events_calendar_upcoming()}</Button
      >
      <Button
        variant={kindSelectorVariant("past")}
        onclick={() => setCalendarKind("past")}
        >{messages.events_calendar_past()}</Button
      >
    </ButtonGroup.Root>
  </div>

  <EventFilters allTags={data.allTags} />
</div>

{#if display === "week"}
  <HomeCalendar
    events={data.events.map((event) => ({
      startDate: event.startDatetime,
      endDate: event.endDatetime,
      slug: event.slug ?? "",
      title: event.title,
    }))}
  />
{:else if display === "month"}
  <!-- TODO: Implement this when the month calendar gets added. -->
  <NotImplemented />
{:else}
  <div class="flex flex-col gap-4 pt-8">
    {#each eventPairs as { last, event }, index (event.id)}
      {@const shouldAddWeekday =
        !last || !dayjs(last.startDatetime).isSame(event.startDatetime, "day")}

      <div
        class="flex flex-col gap-4 sm:flex-row"
        class:pt-8={shouldAddWeekday}
      >
        <div class="min-w-40">
          {#if shouldAddWeekday}
            <h2>
              {dayjs(event.startDatetime).format("dddd")}
            </h2>
            {dayjs(event.startDatetime).format("D MMMM")}
          {/if}
        </div>

        <EventCard {event} {index} />
      </div>
    {:else}
      <div class="flex flex-col items-center gap-1 py-16 text-center">
        <h3>{messages.events_no_events_found()}</h3>
        <p class="text-muted-foreground mt-0">
          {messages.events_change_search_term()}
        </p>
      </div>
    {/each}

    <Pagination pageCount={data.pageCount} />
  </div>
{/if}
