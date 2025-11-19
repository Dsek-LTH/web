<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import {
    CalendarDate,
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import { Calendar } from "$lib/components/ui/calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";

  const df = new DateFormatter("sv-SE", {
    dateStyle: "full",
  });

  function capitalize(s: string) {
    return s.at(0)?.toUpperCase() + s.slice(1);
  }

  function format(date: Date): string {
    let parts = df.formatToParts(date);
    let text = "";
    text += capitalize(parts.find((p) => p.type == "weekday")?.value ?? "");
    text += ", den ";
    text += parts.find((p) => p.type === "day")?.value;
    text += " ";
    text += parts.find((p) => p.type == "month")?.value;

    if (date.getFullYear() != new Date().getFullYear())
      text += " " + parts.find((p) => p.type === "year")?.value;

    return text;
  }

  const { initialValue }: { initialValue?: CalendarDate } = $props();
  let value = $state<DateValue | undefined>(initialValue);
  let contentRef = $state<HTMLElement | null>(null);
</script>

<Popover.Root>
  <Popover.Trigger
    class={cn(
      buttonVariants({
        variant: "outline",
        class: "w-[280px] justify-start text-left font-normal",
      }),
      !value && "text-muted-foreground",
    )}
  >
    <CalendarIcon />
    {value ? format(value.toDate(getLocalTimeZone())) : "Pick a date"}
  </Popover.Trigger>
  <Popover.Content bind:ref={contentRef} class="w-auto p-0">
    <Calendar type="single" bind:value captionLayout="dropdown" />
  </Popover.Content>
</Popover.Root>
