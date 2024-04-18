<script lang="ts">
  // This component shows a live countdown (or count up) timer.

  import ScrollingNumber from "$lib/components/Timer/ScrollingNumber.svelte";

  // It assumes the time is less than an hour. It shows a time where each changed number is changed in a scrolling fashion.
  export let seconds: number;
  $: absSeconds = Math.abs(seconds);
  $: minutesLargeNumber = Math.floor(absSeconds / 600);
  $: minutesSmallNumber = Math.floor(absSeconds / 60) % 10;
  $: secondsLargeNumber = Math.floor((absSeconds % 60) / 10);
  $: secondsSmallNumber = absSeconds % 10;
</script>

<div class="flex h-[1em] items-center text-4xl leading-[1em]">
  {#if seconds < 0}
    -
  {/if}
  <ScrollingNumber i={minutesLargeNumber} />
  <ScrollingNumber i={minutesSmallNumber} />
  <span class="relative">:</span>
  <ScrollingNumber i={secondsLargeNumber} />
  <ScrollingNumber i={secondsSmallNumber} />
</div>
