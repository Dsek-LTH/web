<!--
  @component
  This component shows a number scrolling (up or down) whenever `i` changes
  from one number to another. It will show the previous number scrolling
  out of view and the new number scrolling into view.  
-->
<script lang="ts">
  import ScrollingDigit from "$lib/components/Timer/ScrollingDigit.svelte";
  import { slide } from "svelte/transition";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };

  /** The number to display. */
  export let number = 0;

  // array with each digit of the number (in reverse order), so the number 123 => [3,2,1] and 41 => [1,4] and 8 => [8]
  $: digits = number.toString().split("").reverse().map(Number);
</script>

<span
  class={twMerge(
    "inline-flex h-[1em] flex-row-reverse items-center overflow-hidden leading-[1em]",
    clazz ?? "",
  )}
>
  {#if number < 0}
    -
  {/if}
  {#each digits as digit, index (index)}
    <span class="h-[1em]" transition:slide={{ axis: "x" }}>
      <ScrollingDigit i={digit} />
    </span>
  {/each}
</span>
