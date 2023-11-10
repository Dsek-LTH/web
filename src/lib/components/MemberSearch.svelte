<script lang="ts">
  import type { Member } from "@prisma/client";
  import AuthorSignature from "../../routes/news/AuthorSignature.svelte";
  import { getFullName } from "$lib/utils/member";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";

  let searchedMembers: Member[] | null = null;
  let isSearching = false;
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  export let member: Member | undefined = undefined;
  function handleSearch(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) {
    member = undefined;
    if (timeout) clearTimeout(timeout);
    if (e.currentTarget.value.length < 3) {
      reset();
      return;
    }
    isSearching = true;
    timeout = setTimeout(getMembers(e.currentTarget.value), 300);
  }

  const getMembers = (searchValue: string) => async () => {
    if (!searchValue) {
      reset();
      return;
    }

    const url = new URL(" /api/members");
    url.searchParams.append("search", searchValue);
    const data = await fetch(url, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          handleError();
          return;
        }
        return res.json();
      })
      .catch(() => handleError());
    searchedMembers = data || [];
    isSearching = false;
  };

  function handleError() {
    alert("Something went wrong.");
    reset();
  }

  function reset() {
    searchedMembers = null;
    isSearching = false;
  }
</script>

<div class="dropdown overflow-visible">
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
      value={member ? getFullName(member) : ""}
      on:input={handleSearch}
      {...$$restProps}
    />
    <span
      class="loading loading-spinner loading-md absolute right-2 top-1/2 -translate-y-1/2 text-primary transition-opacity opacity-{isSearching
        ? '100'
        : '0'}"
    />
  </div>
  <ul
    class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 min-w-[20rem] flex-col flex-nowrap overflow-visible overflow-y-auto rounded-md bg-base-100 p-0 shadow shadow-black"
  >
    {#if searchedMembers != null}
      {#each searchedMembers as memberOption (memberOption.id)}
        <li>
          <button
            type="button"
            class="join-item w-full border-b border-b-base-content/10"
            on:click={() => {
              member = memberOption;
            }}
          >
            <AuthorSignature member={memberOption} size="md" />
          </button>
        </li>
      {/each}
      {#if searchedMembers.length === 0}
        <li class="w-full border-b border-b-base-content/10">
          <button type="button" disabled class="disabled">Inga medlemmar hittades</button>
        </li>
      {/if}
    {/if}
  </ul>
</div>
