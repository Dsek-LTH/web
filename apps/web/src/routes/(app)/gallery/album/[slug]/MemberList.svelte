<script lang="ts">
  import MemberCard from "$lib/components/MemberCard.svelte";
  import type { components } from "$lib/api/schema";

  let {
    members,
    titleSingular,
    titlePlural,
  }: {
    members: Array<components["schemas"]["Member"]>;
    titleSingular: string;
    titlePlural: string;
  } = $props();
</script>

<div>
  <h2 class="text-lg font-semibold">
    {members.length > 1 ? titlePlural : titleSingular}
  </h2>
  <div class="flex flex-row flex-wrap items-center gap-2">
    {#each members as m (m.id)}
      <MemberCard member={m} />
    {/each}
  </div>
</div>
