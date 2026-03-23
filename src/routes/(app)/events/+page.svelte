<script lang="ts">
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import NotImplemented from "$lib/components/NotImplemented.svelte";
  import * as ButtonGroup from "$lib/components/ui/button-group/index";
  import Button from "$lib/components/ui/button/button.svelte";
  const { data } = $props();
  import * as messages from "$paraglide/messages";

  type CalendarKind = "week" | "month" | "list";

  let calendarKind: CalendarKind = $state("week");

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
      onclick={() => (calendarKind = "week")}
      >{messages.events_calendar_week()}</Button
    >
    <Button
      variant={kindSelectorVariant("month")}
      onclick={() => (calendarKind = "month")}
      >{messages.events_calendar_month("month")}</Button
    >
    <Button
      variant={kindSelectorVariant("list")}
      onclick={() => (calendarKind = "list")}
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
  <NotImplemented />
{:else}
  <NotImplemented />
{/if}
