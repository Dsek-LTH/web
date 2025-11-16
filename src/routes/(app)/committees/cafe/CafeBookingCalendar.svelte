<script lang="ts">
  import * as m from "$paraglide/messages";
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  let { week } = $props();
</script>

<!-- The bg-zinc here is very ugly, but I couldn't find better fitting colours...-->
<div
  class="m:2 i-mdi-border-radius:25px relative col-span-2 grid gap-2 rounded-lg border border-primary bg-zinc-300 dark:bg-zinc-800"
>
  <div class="flex flex-wrap gap-2 p-2">
    <p>{m.booking_week()} {week}</p>
  </div>
  <div class="mt-4 grid grid-cols-1 gap-3 p-3 md:grid-cols-5 md:gap-0">
    {#each weekDays as day}
      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="flex gap-1 font-medium">{day}</p>
        <p class="flex gap-1 font-bold text-primary">Dagis:</p>
        <div
          class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
        >
          field here
        </div>
        <hr class="mb-2 mt-2 border-base-content" />
        <p class="flex gap-1 font-medium">kl 11-12</p>
        <div
          class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
        >
          field here
        </div>
        <div
          class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
        >
          field here
        </div>
        <hr class="mb-2 mt-2 border-base-content" />
        <p class="flex gap-1 font-medium">kl 12-13</p>
        <div
          class=" m-1 rounded border-2 border-t border-base-300 bg-base-300 p-2"
        >
          field here
        </div>
      </div>
    {/each}
  </div>
</div>
