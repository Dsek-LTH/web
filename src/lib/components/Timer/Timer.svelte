<!--
  @component
  This component shows a live countdown (or count up) timer. 
  The number of seconds will be displayed as `mm:ss`. On every tick,
  each changed number is changed in a scrolling fashion.
  Negative values will be displayed as `-mm:ss`.
-->
<script lang="ts">
  import ScrollingNumber from "$lib/components/Timer/ScrollingNumber.svelte";
  import { twMerge } from "tailwind-merge";

  /** Seconds to display as `mm:ss`. Must be less than an hour. */
  let clazz: string | undefined = undefined;
  export { clazz as class };
  export let seconds: number | undefined = undefined;
  export let milliseconds: number | undefined = undefined;

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
  class={twMerge("inline-flex h-[1em] items-center leading-[1em]", clazz ?? "")}
>
  {#if inSeconds < 0}
    -
  {/if}
  <ScrollingNumber i={minutesLargeNumber} />
  <ScrollingNumber i={minutesSmallNumber} />
  <span class="relative">:</span>
  <ScrollingNumber i={secondsLargeNumber} />
  <ScrollingNumber i={secondsSmallNumber} />
</span>
