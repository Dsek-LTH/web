<script lang="ts">
  import { preventDefault } from "svelte/legacy";

  import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
  import type { Member } from "@prisma/client";

  let modal: HTMLDialogElement = $state();

  interface Props {
    members: Member[];
    class?: string | undefined;
    children?: import("svelte").Snippet;
  }

  let { members, class: clazz = undefined, children }: Props = $props();
</script>

{#if members.length > 0}
  <button onclick={preventDefault(() => modal.showModal())} class={clazz}>
    {@render children?.()}
  </button>
  <dialog id="members_modal" class="modal" bind:this={modal}>
    <ul class="modal-box m-1 flex flex-col">
      {#each members as liker (liker.id)}
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
