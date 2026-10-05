<script lang="ts">
  import MemberCard from "$lib/components/MemberCard.svelte";

  let { members, titleSingular, titlePlural } = $props();
</script>

<h2 class="text-lg font-semibold">
  {members.length > 1 ? titlePlural : titleSingular}
</h2>
<div class="flex flex-row flex-wrap items-center gap-2">
  {#each members as m (m.studentId)}
    <MemberCard member={m} />
  {/each}
</div>
