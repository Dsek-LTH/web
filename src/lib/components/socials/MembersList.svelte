<script lang="ts">
  import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
  import type { Member } from "@prisma/client";
  import type { Snippet } from "svelte";

  let modal: HTMLDialogElement | undefined = $state();

  interface Props {
    members: Member[];
    class?: string | undefined;
    children?: Snippet;
  }

  let { members, class: clazz = undefined, children }: Props = $props();

  let open = $state(false);
  $effect(() => {
    if (modal) modal.showModal();
  });
</script>

{#if members.length > 0}
  <button
    onclick={(event) => {
      event.preventDefault();
      open = true;
    }}
    class={clazz}
  >
    {@render children?.()}
  </button>
  <dialog
    id="members_modal"
    class="modal"
    bind:this={modal}
    onclose={() => (open = false)}
    onclick={(e) => {
      if (e.target === modal) modal?.close();
    }}
  >
    {#if open}
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
    {/if}
  </dialog>
{/if}
