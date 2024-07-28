<script lang="ts">
  import { onMount } from "svelte";

  let modal: HTMLDialogElement;
  let mounted = false;
  export let show: boolean;

  onMount(() => {
    mounted = true;
  });

  $: if (mounted && modal) {
    if (show) {
      modal.showModal();
    } else {
      modal.close();
    }
  }
</script>

<dialog class="modal" bind:this={modal}>
  <div class="modal-box">
    <slot />
  </div>
</dialog>
