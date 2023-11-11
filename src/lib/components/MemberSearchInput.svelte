<script lang="ts">
  import MemberSearch from "$lib/components/MemberSearch.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/member";
  import type { Member } from "@prisma/client";
  export let member: Member | undefined = undefined;
  let isSearching: boolean;
  let handleSearch: (search: string) => void;
</script>

<MemberSearch
  bind:handleSearch
  bind:isSearching
  onSelect={(selectedMember) => {
    member = selectedMember;
  }}
>
  <div class="relative flex h-full flex-col gap-2">
    {#if member}
      <input type="hidden" name="memberId" value={member.id} />
      <div class="absolute left-4 top-1/2 flex -translate-y-1/2 justify-center">
        <MemberAvatar {member} class="w-8" />
      </div>
    {/if}
    <input
      id="autocomplete"
      autocomplete="off"
      autocapitalize="off"
      type="text"
      class="input input-bordered w-full {member ? 'indent-10' : ''}"
      placeholder="Sök efter medlem"
      tabIndex={0}
      value={member ? getFullName($page.data?.user, member) : ""}
      on:input={(e) => {
        member = undefined;
        handleSearch(e.currentTarget.value);
      }}
      {...$$restProps}
    />
    <span
      class="loading-sspinner loading loading-md absolute right-2 top-1/2 -translate-y-1/2 text-primary transition-opacity opacity-{isSearching
        ? '100'
        : '0'}"
    />
  </div>
</MemberSearch>
