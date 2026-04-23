<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import {
    DateFormatter,
    getLocalTimeZone,
    parseDate,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$lib/components/ui/button";
  import { Calendar } from "$lib/components/ui/calendar";
  import * as Popover from "$lib/components/ui/popover";
  import * as m from "$paraglide/messages";
  import type { AriaAttributes } from "svelte/elements";
  import type { ClassValue } from "clsx";

  const df = new DateFormatter(m.locale(), {
    dateStyle: "full",
  });

  function capitalize(s: string) {
    return s.at(0)?.toUpperCase() + s.slice(1);
  }

  function format(date: Date): string {
    let parts = df.formatToParts(date);
    let text = "";
    text += capitalize(parts.find((p) => p.type == "weekday")?.value ?? "");
    text += m.datepicker_weekday_separator();
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
    error = false,
    name,
    ...restProps
  }: AriaAttributes & {
    value?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    class?: ClassValue;
    error?: boolean;
    name?: string;
  } = $props();
  let contentRef = $state<HTMLElement | null>(null);

  //let value: string | null | undefined = $state();
</script>

<Popover.Root>
  <Popover.Trigger
    class={cn(
      buttonVariants({
        variant: "outline",
        class: "w-[280px] justify-start text-left font-normal",
      }),
      !value && "text-muted-foreground",
      error && "bg-rosa-50 dark:bg-rosa-950 border-rosa-background",
      className,
    )}
  >
    <CalendarIcon />
    {value
      ? format(parseDate(value).toDate(getLocalTimeZone()))
      : m.datepicker_pick_date()}
  </Popover.Trigger>
  <Popover.Content bind:ref={contentRef} class="bg-background w-auto p-0">
    <Calendar
      type="single"
      bind:value={() =>
        value ? parseDate(value) : (null as unknown as undefined), // I would like to apologize for this
      (date) => (value = date!.toString())}
      captionLayout="dropdown"
      {weekStartsOn}
      class="rounded-md border shadow-sm"
      {...restProps}
    />
  </Popover.Content>
</Popover.Root>
<input type="hidden" bind:value {name} />
