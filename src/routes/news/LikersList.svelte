<script lang="ts">
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";
  import AuthorSignature from "./AuthorSignature.svelte";

  let modal: HTMLDialogElement;
  export let likers: Member[];
  $: likersText =
    likers.length > 2
      ? `${getFullName($page.data.session?.user, likers[0]!)}, ${getFullName(
          $page.data.session?.user,
          likers[1]!
        )} och ${likers.length - 2} andra`
      : `${likers.map((m) => getFullName($page.data.session?.user, m)).join(" och ")}`;
</script>

{#if likers.length > 0}
  <button
    on:click|preventDefault={() => modal.showModal()}
    class="link text-sm opacity-40 hover:opacity-60"
  >
    {likersText} gillar detta
  </button>
  <dialog id="likers_modal" class="modal" bind:this={modal}>
    <ul class="menu modal-box">
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
