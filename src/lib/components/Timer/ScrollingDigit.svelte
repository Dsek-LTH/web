<!--
  @component
  This component shows a number scrolling (up or down) whenever `i` changes
  from one number to another. It will show the previous number scrolling
  out of view and the new number scrolling into view.  
-->
<script lang="ts">
  import { run } from "svelte/legacy";

  interface Props {
    /** The number to display. */
    i?: number;
  }

  let { i = 0 }: Props = $props();

  let lastI: number | undefined = $state(undefined);
  let currentI: number = $state(i);

  const updateI = (newI: number) => {
    lastI = currentI;
    currentI = newI;
  };

  run(() => {
    updateI(i);
  });

  let allNumbers = $derived(Array.from({ length: 12 }, (_, i) => i - 1));
  let isBigJump = $derived(
    lastI !== undefined &&
      ((lastI === 0 && currentI > 1) || (lastI > 1 && currentI === 0)),
  );
  let direction = $derived(isBigJump ? (currentI > 1 ? 1 : -1) : 0);
</script>

<div class="relative h-[1em] text-center transition-all">
  <span class="opacity-0">{currentI}</span>
  <div
    class="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out"
    style="top: {isBigJump ? direction : 0}em"
  >
    <div class="relative">
      {#each allNumbers as number (number)}
        <span
          aria-hidden="true"
          class="absolute inset-0 block leading-[1em] transition-all duration-300 ease-out"
          class:transition-none={isBigJump}
          style="top: {number - currentI + (isBigJump ? -direction : 0)}em;"
        >
          {(number + 10) % 10}
        </span>
      {/each}
    </div>
  </div>
</div>
