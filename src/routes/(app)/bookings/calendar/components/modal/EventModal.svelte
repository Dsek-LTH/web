<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { TextAlignStart, MapPin, User, CalendarPlus } from "@lucide/svelte";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Duration from "./Duration.svelte";
  import Section from "./Section.svelte";
  import Header from "./Header.svelte";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();

  const startDate = $derived(calendarEvent.start);
  const endDate = $derived(calendarEvent.end);
</script>

<!-- TODO: Add translations -->
<!-- TODO: Add logic -->
<div
  class="bg-background border-border/40 w-[340px] rounded-2xl border p-6 shadow-2xl"
>
  <Header
    title={calendarEvent.title ?? "-"}
    calendarId={calendarEvent.calendarId}
  />

  <div class="space-y-4">
    <Duration {startDate} {endDate} />

    <Section Icon={User} header={calendarEvent.people?.[0] ?? "-"} />

    <Section Icon={MapPin} header={calendarEvent.location ?? "-"} />

    <Separator class="bg-muted mt-5 mb-2" />

    <Section
      Icon={TextAlignStart}
      class="text-muted-foreground mt-0 leading-relaxed"
    >
      {#snippet content()}
        <p class="text-[11px]">
          {calendarEvent.description}
        </p>
      {/snippet}
    </Section>
  </div>

  <div class="mt-6">
    <Button class="w-full">
      <CalendarPlus class="size-4" />
      <span class="uppercase"> Add to my calendar </span>
    </Button>
  </div>
</div>
