<script lang="ts">
  import { enhance } from "$app/forms";

  export let fileId: string;
  export let fileName: string;
  let deleteModal: HTMLDialogElement | undefined = undefined;
</script>

<button
  on:click={() => {
    deleteModal?.showModal();
  }}
  class="btn btn-error btn-sm pointer-events-auto">X</button
>
<dialog bind:this={deleteModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Delete file</h3>
    <p class="py-4">
      Are you sure you want to delete the file <strong>{fileName}</strong>?
    </p>
    <div class="modal-action">
      <form method="POST" action="?/deleteFile" use:enhance>
        <input type="hidden" name="id" value={fileId} /><button
          type="submit"
          class="btn btn-error"
          on:click={() => deleteModal?.close()}>Delete</button
        >
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button></button>
  </form>
</dialog>
