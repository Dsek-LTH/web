<!-- @migration-task Error while migrating Svelte code: Cannot overwrite a zero-length range – use appendLeft or prependRight instead -->
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
  $: absSeconds = inSeconds < 0 && !allowNegative ? 0 : Math.abs(inSeconds);
</script>

<!-- <span class={twMerge("countdown font-mono", clazz)}>
  <span style="--value:{Math.floor(absSeconds / 60)};"></span>
  :
  <span style="--value:{Math.floor(absSeconds % 60)};"></span>
</span> -->
<span
  class={twMerge(
    "inline-flex h-[1em] items-center overflow-hidden font-mono leading-[1em]",
    clazz ?? "",
  )}
>
  {#if allowNegative && inSeconds < 0}
    -
  {/if}
  <ScrollingDigit i={Math.floor(absSeconds / 600)} />
  <ScrollingDigit i={Math.floor(absSeconds / 60) % 10} />
  <span class="relative">:</span>
  <ScrollingDigit i={Math.floor((absSeconds % 60) / 10)} />
  <ScrollingDigit i={absSeconds % 10} />
</span>
