<script lang="ts">
  import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
  import type { Member } from "@prisma/client";

  let modal: HTMLDialogElement;
  export let members: Member[];

  let clazz: string | undefined = undefined;
  export { clazz as class };
</script>

{#if members.length > 0}
  <button on:click|preventDefault={() => modal.showModal()} class={clazz}>
    <slot />
  </button>
  <dialog id="members_modal" class="modal" bind:this={modal}>
    <ul class="modal-box m-1 flex flex-col">
      {#each members as liker (liker.id)}
        <li>
          <AuthorSignature type="member" lazy member={liker} />
        </li>
      {/each}
    </ul>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}
