<script lang="ts">
  // This component shows a number scrolling (up or down) whenever i changes
  export let i = 0;
  let lastI: number | undefined = undefined;
  let currentI: number = i;

  const updateI = (newI: number) => {
    lastI = currentI;
    currentI = newI;
  };

  $: updateI(i);

  $: allNumbers = Array.from({ length: 12 }, (_, i) => i - 1);
  $: isBigJump =
    lastI !== undefined &&
    ((lastI === 0 && currentI > 1) || (lastI > 1 && currentI === 0));
</script>

<div class="relative h-[1em] overflow-hidden text-center transition-all">
  <span class="opacity-0">{currentI}</span>
  <div
    class="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out"
    style="top: {isBigJump ? 1 : 0}em"
  >
    <div class="relative">
      {#each allNumbers as number (number)}
        <span
          aria-hidden="true"
          class="absolute inset-0 block leading-[1em] duration-300 ease-out {isBigJump
            ? 'transition-none'
            : 'transition-all'}"
          style="top: {number - currentI + (isBigJump ? -1 : 0)}em;"
        >
          {(number + 10) % 10}
        </span>
      {/each}
    </div>
  </div>
</div>
