<script lang="ts">
  import MedalCard from "./MedalCard.svelte";
  import type { Member } from "@prisma/client";

  export let groups: Array<{
    medal: string;
    recipients: Member[];
  }>;

  $: everyOtherGroup = groups.filter((_, i) => i % 2 === 0);
  $: everyOtherGroup2 = groups.filter((_, i) => i % 2 === 1);
</script>

<div class="hidden grid-cols-2 gap-4 md:grid">
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherGroup as group (group.medal)}
      <MedalCard medal={group.medal} recipients={group.recipients} />
    {/each}
  </div>
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherGroup2 as group (group.medal)}
      <MedalCard medal={group.medal} recipients={group.recipients} />
    {/each}
  </div>
</div>

<div class="grid gap-4 md:hidden">
  {#each groups as group (group.medal)}
    <MedalCard medal={group.medal} recipients={group.recipients} />
  {/each}
</div>
