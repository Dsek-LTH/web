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

  type Props = {
    class?: string;
    allowNegative?: boolean;
  } & (
    | {
        /** Seconds to display as `mm:ss`. Must be less than an hour. */
        seconds: number;
        milliseconds?: never;
      }
    | {
        seconds?: never;
        /** Milliseconds to display as `mm:ss`. Must be less than an hour. */
        milliseconds: number;
      }
  );

  let {
    class: clazz = "",
    allowNegative = false,
    seconds = undefined,
    milliseconds = undefined,
  }: Props = $props();

  let inSeconds = $derived(seconds ?? Math.ceil(milliseconds! / 1000));
  let absSeconds = $derived(
    inSeconds < 0 && !allowNegative ? 0 : Math.abs(inSeconds),
  );
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
