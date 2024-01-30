<script lang="ts">
  import { page } from "$app/stores";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "./AuthorSignature.svelte";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };

  export let isSearching = false;
  export let onSelect: ((member: Member) => void) | undefined = undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  export const handleSearch = (searchValue: string) => {
    if (timeout) clearTimeout(timeout);
    if (searchValue.length < 3) {
      reset();
      return;
    }
    isSearching = true;
    timeout = setTimeout(getMembers(searchValue), 300);
  };

  let searchedMembers: Member[] | null = null;
  const getMembers = (searchValue: string) => async () => {
    if (!searchValue) {
      reset();
      return;
    }

    const url = new URL($page.url.protocol + $page.url.host + "/api/members");
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

  const handleError = () => {
    console.error("Failed to fetch members");
    reset();
  };

  const reset = () => {
    searchedMembers = null;
    isSearching = false;
  };
</script>

<div class={twMerge("dropdown overflow-visible", clazz)}>
  <slot />
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
              onSelect?.(memberOption);
              reset();
            }}
          >
            <AuthorSignature links={false} member={memberOption} size="md" />
          </button>
        </li>
      {/each}
      {#if searchedMembers.length === 0}
        <li class="w-full border-b border-b-base-content/10">
          <button type="button" disabled class="disabled"
            >Inga medlemmar hittades</button
          >
        </li>
      {/if}
    {/if}
  </ul>
</div>
