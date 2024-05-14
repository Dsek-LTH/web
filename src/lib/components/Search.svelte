<script lang="ts">
  import type { Member } from "@prisma/client";

  let value = "";
  let dialog: HTMLDialogElement;
  let dialogShowing: boolean;

  let users: Member[] = [];

  async function getMembers() {
    const response = await fetch(
      "/api/members?" + new URLSearchParams({ search: value }),
    );
    users = await response.json();
    length = users.length;
  }

  function showDialog() {
    dialogShowing = true;
    dialog.showModal();
  }

  function hideDialog() {
    value = "";
    users = [];
    dialogShowing = false;
    dialog.close();
  }
</script>

<button class="btn btn-ghost" on:click={showDialog}>
  <span class="i-mdi-magnify size-6" />
</button>

<dialog class="modal" bind:this={dialog} on:close={hideDialog}>
  <div class="modal-box h-4/5 rounded-none bg-transparent shadow-none">
    {#if dialogShowing}
      <label
        class="input input-bordered flex h-10 items-center gap-2 bg-base-200 bg-opacity-60 pl-2 shadow filter backdrop-blur"
      >
        <span class="i-mdi-magnify size-6" />
        <input
          type="text"
          placeholder="Search"
          class="bg-transparent"
          bind:value
          on:input={getMembers}
        />
      </label>
      {#if users.length > 0}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <ul
          tabindex="0"
          class="dropdown-content mt-2 flex w-full flex-col
           gap-2 rounded-md bg-base-200 bg-opacity-60 p-2 shadow filter backdrop-blur transition-all"
        >
          {#each users.slice(0, 10) as user}
            <li>
              <a
                href={"/members/" + user.studentId}
                class="btn btn-ghost btn-sm flex flex-row justify-between"
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
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
