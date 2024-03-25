<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Alert } from "@prisma/client";
  import dayjs from "dayjs";

  export let data;

  let removeModal: HTMLDialogElement | undefined = undefined;
  let selectedAlert: Alert | undefined = undefined;
</script>

<form
  method="POST"
  class="flex w-full flex-col items-center gap-2"
  action="?/create"
>
  <input
    type="text"
    name="message"
    placeholder="Meddelande Svenska"
    class="input input-bordered w-full max-w-lg"
  />
  <input
    type="text"
    name="messageEn"
    placeholder="Meddelande Engelska"
    class="input input-bordered w-full max-w-lg"
  />
  <select name="severity" class="select select-bordered w-full max-w-lg">
    <option disabled selected>Severity</option>
    <option value="info">Info</option>
    <option value="success">Success</option>
    <option value="warning">Warning</option>
    <option value="error">Error</option>
  </select>
  <button class="btn w-full max-w-lg">Skapa</button>
</form>
<div class="divider">Aktiva alerts</div>
<table class="table">
  <thead>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Skapad</th>
      <th />
    </tr>
  </thead>

  <tbody>
    {#each data.alert as alert}
      <tr>
        <th class="capitalize">{alert.severity}</th>
        <td>{alert.message}</td>
        <td>{dayjs(alert.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
        <td>
          <button
            class="btn btn-square"
            on:click={() => {
              selectedAlert = alert;
              removeModal?.showModal();
            }}
          >
            <span class="i-mdi-delete text-xl" />
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<dialog bind:this={removeModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Remove alert</h3>
    <p class="py-4">Are you sure you want to remove this alert?</p>
    <p class="text-xs text-base-content/60">{selectedAlert?.message}</p>
    <div class="modal-action">
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={selectedAlert?.id} />
        <button
          type="submit"
          class="btn btn-error"
          on:click={() => removeModal?.close()}
        >
          Remove
        </button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button class="cursor-auto" />
  </form>
</dialog>
