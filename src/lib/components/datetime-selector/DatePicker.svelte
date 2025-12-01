<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import {
    CalendarDate,
    DateFormatter,
    getLocalTimeZone,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$lib/components/ui/button";
  import { Calendar, type CalendarProps } from "$lib/components/ui/calendar";
  import * as Popover from "$lib/components/ui/popover";

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

  let {
    value = $bindable(),
    weekStartsOn = 1,
    class: className,
    ...restProps
  }: Omit<CalendarProps, "type" | "captionLayout"> = $props(); // @ts-ignore
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
  <Popover.Content bind:ref={contentRef} class="bg-background w-auto p-0">
    <Calendar
      type="single"
      bind:value
      captionLayout="dropdown"
      {weekStartsOn}
      class={cn("rounded-md border shadow-sm", className)}
      {...restProps}
    />
  </Popover.Content>
</Popover.Root>
