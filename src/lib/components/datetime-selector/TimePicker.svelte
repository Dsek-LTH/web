<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import { cn } from "$lib/utils";

  import { formatTimeString } from "./timehelpers";

  let {
    initialTime = new Date(),
    timestep = 1,
    oninput,
  }: {
    initialTime?: Date;
    timestep?: number;
    oninput?: (value: string) => void;
  } = $props();

  const tstep = Math.min(Math.max(1, timestep), 60);

  const now =
    initialTime.getHours() * 60 +
    Math.ceil(initialTime.getMinutes() / tstep) * tstep;

  let value = $state(
    initialTime.getHours().toString().padStart(2, "0") +
      ":" +
      (Math.ceil(initialTime.getMinutes() / tstep) * tstep)
        .toString()
        .padStart(2, "0"),
  );
  let error: Error | undefined = $state();

  const formatValue = () => {
    let parsed = formatTimeString(value);

    if (parsed === undefined) {
      return;
    }

    value = parsed;
    setTimeout(() => oninput?.(value), 0);
  };

  const eachInput = () => {
    if (value === "") {
      error = undefined;
      return;
    }

    let parsed = formatTimeString(value);

    if (parsed === undefined) {
      error = new Error("Invalid time");
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
  bind:value
  onchange={formatValue}
  oninput={eachInput}
  placeholder="hh:mm"><ClockIcon class="h-4 w-full" /></Input
>
