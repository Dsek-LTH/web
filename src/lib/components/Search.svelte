<script lang="ts">
  import type { Member } from "@prisma/client";
  import { fade } from "svelte/transition";

  let value = "";
  let show = false;
  let users: Member[] = [];
  const searchBackgroundId = "searchBackground";

  async function getMembers() {
    if (value === "") {
      users = [];
      return;
    }
    const response = await fetch(
      "/api/members?" + new URLSearchParams({ search: value }),
    );
    users = await response.json();
  }

  function showDialog() {
    show = true;
    document.body.style.overflow = "hidden";
  }

  function hideDialog() {
    value = "";
    users = [];
    show = false;
    document.body.style.overflow = "auto";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "k") {
      event.preventDefault();
      showDialog();
    } else if (event.key === "Escape") {
      hideDialog();
    }
  }

  function clickOutside(event: MouseEvent) {
    if ((event.target as HTMLElement).id === searchBackgroundId) hideDialog();
  }
</script>

<svelte:document on:keydown={handleKeydown} />

<noscript>
  <style>
    .js {
      display: none;
    }
  </style>
  <a href="/search" class="btn btn-ghost">
    <span class="i-mdi-magnify size-6" />
  </a>
</noscript>

<button class="js btn btn-ghost" on:click={showDialog}>
  <span class="i-mdi-magnify size-6" />
</button>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="absolute left-0 top-0 z-50 h-screen w-screen backdrop-blur"
    id={searchBackgroundId}
    transition:fade={{ duration: 100 }}
    on:click={clickOutside}
  >
    <div class="mx-auto mb-auto mt-8 w-full max-w-md">
      <form class="rounded-2xl bg-base-100 p-2 shadow">
        <div class="flex gap-2">
          <label class="input flex w-full items-center gap-2">
            <span class="i-mdi-magnify size-6" />
            <!-- svelte-ignore a11y-autofocus -->
            <input
              type="text"
              placeholder="Sök efter medlemmar"
              class="bg-transparent"
              autofocus
              bind:value
              on:input={getMembers}
            />
          </label>
          <button class="btn btn-ghost" on:click={hideDialog}>
            <kbd class="kbd">ESC</kbd>
          </button>
        </div>
        {#if users.length > 0}
          <ul class="mt-2 flex flex-col gap-1">
            {#each users.slice(0, 10) as user}
              <li>
                <a
                  href={"/members/" + user.studentId}
                  class="btn flex justify-between"
                  on:click={hideDialog}
                >
                  <div>{user.firstName} {user.lastName}</div>
                  <div class="text-primary">({user.studentId})</div>
                </a>
              </li>
            {/each}
            {#if users.length > 10}
              <li class="text-center">...</li>
            {/if}
          </ul>
        {/if}
      </form>
    </div>
  </div>
{/if}
