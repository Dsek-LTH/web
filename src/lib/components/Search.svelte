<script lang="ts">
  import type { Member } from "@prisma/client";

  let value = "";

  let users: Member[] = [];

  async function getMembers() {
    const response = await fetch(
      "/api/members?" + new URLSearchParams({ search: value }),
    );
    users = await response.json();
    console.log(users);
    length = users.length;
  }
</script>

<div class="dropdown dropdown-hover relative mx-auto">
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
      class="dropdown-content flex w-full flex-col gap-2
             rounded-b-xl bg-base-200 bg-opacity-60 p-2 shadow filter backdrop-blur transition-all"
    >
      {#each users.slice(0, 10) as user}
        <li>
          <a
            href={"/members/" + user.studentId}
            class="btn btn-ghost btn-sm flex flex-row justify-between"
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
</div>
