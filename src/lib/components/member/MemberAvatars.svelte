<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import type { MemberNames } from "$lib/utils/client/member";

  const {
    members,
  }: { members: Array<MemberNames & { picturePath: string | null }> } =
    $props();
</script>

{#if members.length === 1}
  <MemberAvatar class="size-10" member={members[0]} />
{:else}
  <div class="ml-6 flex w-fit flex-row">
    {#each members.slice(0, 3) as member (member.firstName)}
      <div class="-ml-6">
        <MemberAvatar {member} />
      </div>
    {/each}
  </div>
{/if}
