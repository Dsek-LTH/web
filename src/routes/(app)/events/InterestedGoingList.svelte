<script lang="ts">
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "$lib/components/AuthorSignature.svelte";
  import * as m from "$paraglide/messages";

  let goingModal: HTMLDialogElement;
  let interestedModal: HTMLDialogElement;
  export let interested: Member[];
  export let going: Member[];

  $: goingText =
    going.length > 0
      ? going.length === 1
        ? m.events_interestedGoing_isGoing({ x: getFullName(going[0]!) })
        : m.events_interestedGoing_areGoing({
            x:
              going.length > 2
                ? m.events_interestedGoing_threeOrMore({
                    name1: getFullName(going[0]!),
                    name2: getFullName(going[1]!),
                    others: going.length - 2,
                  })
                : m.events_interestedGoing_two({
                    name1: getFullName(going[0]!),
                    name2: getFullName(going[1]!),
                  }),
          })
      : "";

  $: interestedText =
    interested.length > 0
      ? interested.length === 1
        ? m.events_interestedGoing_isInterested({
            x: getFullName(interested[0]!),
          })
        : m.events_interestedGoing_areInterested({
            x:
              interested.length > 2
                ? m.events_interestedGoing_threeOrMore({
                    name1: getFullName(interested[0]!),
                    name2: getFullName(interested[1]!),
                    others: interested.length - 2,
                  })
                : m.events_interestedGoing_two({
                    name1: getFullName(interested[0]!),
                    name2: getFullName(interested[1]!),
                  }),
          })
      : "";
</script>

{#if going.length > 0}
  <button
    on:click|preventDefault={() => goingModal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {goingText}
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
      <button>{m.events_interestedGoing_close()}</button>
    </form>
  </dialog>
{/if}
<br />
{#if interested.length > 0}
  <button
    on:click|preventDefault={() => interestedModal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {interestedText}
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
      <button>{m.events_interestedGoing_close()}</button>
    </form>
  </dialog>
{/if}
