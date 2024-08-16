<!--
  @component
  This component shows a live countdown (or count up) timer. 
  The number of seconds will be displayed as `mm:ss`. On every tick,
  each changed number is changed in a scrolling fashion.
  Negative values will be displayed as `-mm:ss`.
-->
<script lang="ts">
  import ScrollingDigit from "$lib/components/Timer/ScrollingDigit.svelte";
  import { twMerge } from "tailwind-merge";

  /** Seconds to display as `mm:ss`. Must be less than an hour. */
  let clazz: string | undefined = undefined;
  export { clazz as class };
  export let seconds: number | undefined = undefined;
  export let milliseconds: number | undefined = undefined;
  export let allowNegative = false;

  $: if (seconds === undefined && milliseconds === undefined) {
    throw new Error("Either `seconds` or `milliseconds` must be provided.");
  }

  $: inSeconds = seconds ?? Math.ceil(milliseconds! / 1000);
  $: absSeconds = Math.abs(inSeconds);
  $: minutesLargeNumber = Math.floor(absSeconds / 600);
  $: minutesSmallNumber = Math.floor(absSeconds / 60) % 10;
  $: secondsLargeNumber = Math.floor((absSeconds % 60) / 10);
  $: secondsSmallNumber = absSeconds % 10;
</script>

<span
  class={twMerge(
    "inline-flex h-[1em] items-center overflow-hidden font-mono leading-[1em]",
    clazz ?? "",
  )}
>
  {#if allowNegative && inSeconds < 0}
    -
  {/if}
  <ScrollingDigit i={minutesLargeNumber} />
  <ScrollingDigit i={minutesSmallNumber} />
  <span class="relative">:</span>
  <ScrollingDigit i={secondsLargeNumber} />
  <ScrollingDigit i={secondsSmallNumber} />
</span>
