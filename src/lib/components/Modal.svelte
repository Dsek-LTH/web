<script lang="ts">
  import { run, preventDefault } from "svelte/legacy";

  import { onMount } from "svelte";

  let modal: HTMLDialogElement = $state();
  let mounted = $state(false);
  interface Props {
    show: boolean;
    backdrop?: boolean;
    onClose?: (() => void) | undefined;
    children?: import("svelte").Snippet;
  }

  let {
    show,
    backdrop = false,
    onClose = undefined,
    children,
  }: Props = $props();

  onMount(() => {
    mounted = true;
  });

  run(() => {
    if (mounted && modal) {
      if (show) {
        modal.showModal();
      } else {
        modal.close();
      }
    }
  });
</script>

<dialog class="modal" bind:this={modal}>
  <div class="modal-box">
    {@render children?.()}
  </div>
  {#if backdrop}
    {#if onClose}
      <form
        method="dialog"
        class="modal-backdrop"
        onsubmit={preventDefault(onClose)}
      >
        <button>close</button>
      </form>
    {:else}
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    {/if}
  {/if}
</dialog>
