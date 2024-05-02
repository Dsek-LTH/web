<script lang="ts">
  import type { Member } from "@prisma/client";

  let value = "";

  let users: Member[] = [];

  async function getMembers() {
    const response = await fetch(
      "/api/members?" + new URLSearchParams({ search: value }),
    );
    users = await response.json();
  }
</script>

<div class="dropdown dropdown-hover mx-auto">
  <label
    class="input input-bordered flex h-10 items-center gap-2 bg-transparent pl-2"
  >
    <span class="i-mdi-magnify size-6" />
    <input
      type="text"
      class="bg-transparent"
      placeholder="Search"
      bind:value
      on:input={getMembers}
    />
  </label>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  {#if users.length > 0}
    <ul
      tabindex="0"
      class="dropdown-content bg-base-100 flex w-full flex-col gap-2 rounded-2xl p-2"
    >
      {#each users as user}
        <li>
          <a href="/members/ol1662le-s" class="btn flex w-full flex-col p-2">
            <div>{user.firstName} {user.lastName}</div>
            <div class="text-primary">({user.studentId})</div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
