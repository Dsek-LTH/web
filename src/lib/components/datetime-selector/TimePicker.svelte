<script lang="ts">
  import { Input, type InputProps } from "$lib/components/ui/input";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import { parseTime, Time } from "@internationalized/date";
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";

  import { formatTimeString } from "./timehelpers";

  let {
    value = $bindable(parseTime("00:00")),
    oninput,
    ...restProps
  }: InputProps & {
    timestep?: number;
    oninput?: (value: Time) => void;
    value?: Time;
  } = $props();

  let timeString = $state(value.toString().substring(0, 5));
  let error: Error | undefined = $state();

  $effect(() => {
    timeString = value.toString().substring(0, 5);
  });

  const formatValue = () => {
    let parsed = formatTimeString(timeString);

    if (parsed === undefined) {
      return;
    }

    timeString = parsed;
    value = parseTime(timeString);
    setTimeout(() => oninput?.(value), 0);
  };

  const eachInput = () => {
    if (timeString === "") {
      error = undefined;
      return;
    }

    let parsed = formatTimeString(timeString);

    if (parsed === undefined) {
      error = new Error(m.timepicker_invalid_time());
      return;
    }

    error = undefined;
  };
</script>

<Input
  class={cn(
    " w-[12ch]",
    error ? "border-rosa-500 bg-rosa-50 dark:bg-rosa-950" : "",
  )}
  aria-errormessage={error ? error.message : ""}
  bind:value={timeString}
  onchange={formatValue}
  oninput={eachInput}
  placeholder="hh:mm"
  {...restProps}><ClockIcon class="h-4 w-full" /></Input
>
