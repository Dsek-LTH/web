<script lang="ts">
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "$lib/components/AuthorSignature.svelte";
  import * as m from "$paraglide/messages";

  let modal: HTMLDialogElement;
  export let likers: Member[];

  const formatLikersList = (likers: Member[]): string => {
    switch (likers.length) {
      case 0:
        return "";
      case 1:
        return getFullName(likers[0]!);
      case 2:
        return m.news_two({
          name1: getFullName(likers[0]!),
          name2: getFullName(likers[1]!),
        });
      default:
        return m.news_threeOrMore({
          name1: getFullName(likers[0]!),
          name2: getFullName(likers[1]!),
          others: likers.length - 2,
        });
    }
  };

  $: likersText = formatLikersList(likers);
</script>

{#if likers.length > 0}
  <button
    on:click|preventDefault={() => modal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {m.news_likesThis({ x: likersText })}
  </button>
  <dialog id="likers_modal" class="modal" bind:this={modal}>
    <ul class="modal-box m-1 flex flex-col">
      {#each likers as liker (liker.id)}
        <li>
          <AuthorSignature type="member" member={liker} />
        </li>
      {/each}
    </ul>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}
