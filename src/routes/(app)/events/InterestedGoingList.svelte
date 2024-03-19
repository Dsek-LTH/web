<script lang="ts">
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "$lib/components/AuthorSignature.svelte";

  let goingModal: HTMLDialogElement;
  let interestedModal: HTMLDialogElement;
  export let interested: Member[];
  export let going: Member[];

  $: goingText =
    going.length > 2
      ? `${getFullName(going[0]!)}, ${getFullName(going[1]!)} och ${
          going.length - 2
        } andra`
      : `${going.map((m) => getFullName(m)).join(" och ")}`;

  $: interestedText =
    interested.length > 2
      ? `${getFullName(interested[0]!)}, ${getFullName(interested[1]!)} och ${
          interested.length - 2
        } andra`
      : `${interested.map((m) => getFullName(m)).join(" och ")}`;
</script>

{#if going.length > 0}
  <button
    on:click|preventDefault={() => goingModal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {goingText} kommer
  </button>
  <dialog id="going_modal" class="modal" bind:this={goingModal}>
    <ul class="modal-box m-1 flex flex-col">
      {#each going as person (person.id)}
        <li>
          <AuthorSignature type="member" member={person} />
        </li>
      {/each}
    </ul>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}
<br />
{#if interested.length > 0}
  <button
    on:click|preventDefault={() => interestedModal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {interestedText} är intresserade
  </button>
  <dialog id="interested_modal" class="modal" bind:this={interestedModal}>
    <ul class="modal-box m-1 flex flex-col">
      {#each interested as person (person.id)}
        <li>
          <AuthorSignature type="member" member={person} />
        </li>
      {/each}
    </ul>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}
