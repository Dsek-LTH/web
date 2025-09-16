<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { emailFormSchema } from "../helpers";
  import { enhance } from "$app/forms";

  let { data } = $props();
  let { mail: email, recipients = [] } = $derived(data.emailAlias);

  const {
    form,
    enhance: superEnhance,
    errors,
  } = superForm(data.form, {
    validators: zodClient(emailFormSchema),
    resetForm: true,
  });

  let addDialog: HTMLDialogElement;
  let removeDialog: HTMLDialogElement;
  let selectedRecipient: string | undefined = $state();
</script>

<SetPageTitle title={email} />

<div class="mb-6 flex justify-between">
  <h1 class="text-lg font-bold">{email}</h1>
  <a href="/admin/email-alias" class="btn btn-neutral btn-xs">
    <span class="i-mdi-arrow-left"></span>
    <p>Go back</p>
  </a>
</div>

<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr class="bg-base-200">
        <th>Mottagare</th>
        <th>
          <button
            class="btn btn-primary btn-xs float-right px-4"
            onclick={() => addDialog.showModal()}
          >
            <span class="i-mdi-add"></span>
            Lägg till
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each recipients as recipient (recipient)}
        <tr>
          <td class="font-medium">{recipient}</td>
          <td class="text-right">
            <button
              class="btn btn-outline btn-xs px-8"
              onclick={() => {
                removeDialog.showModal();
                selectedRecipient = recipient;
              }}
            >
              Ta bort
            </button>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="2" class="text-center">No recipients found.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Dialog for adding a new recipient -->
<dialog class="modal modal-bottom sm:modal-middle" bind:this={addDialog}>
  <div class="modal-box flex flex-col gap-4">
    <h3 class="text-lg font-bold">Add a recipient</h3>
    <p>Enter an email address you'd like to add as a recipient.</p>
    <form
      class="w-full *:input-bordered"
      class:*:input-error={$errors.email}
      id="add_recipient"
      method="POST"
      action="?/add"
      use:superEnhance
    >
      <label class="input flex w-full items-center gap-2">
        <span class="i-mdi-email"></span>
        <input
          class="w-full"
          type="text"
          placeholder="dsek.cpu@dsek.se"
          name="email"
          required
          bind:value={$form.email}
        />
      </label>
    </form>

    {#if $errors.email}
      <p class="text-error">{$errors.email}</p>
    {/if}

    <div class="modal-action">
      <form method="dialog" class="flex gap-2">
        <button class="btn">Cancel</button>
        <button
          class="btn btn-primary"
          form="add_recipient"
          onclick={() => addDialog.close()}
        >
          Add
        </button>
      </form>
    </div>
  </div>
</dialog>

<!-- Dialog for removing recipient -->
<dialog class="modal modal-bottom sm:modal-middle" bind:this={removeDialog}>
  <div class="modal-box flex flex-col gap-4">
    <h3 class="text-lg font-bold">Remove recipient</h3>
    <p>Are you sure you want to remove <b>{selectedRecipient}</b>?</p>

    <form
      action="?/remove"
      method="POST"
      use:enhance
      class="hidden"
      id="remove_email_alias"
    >
      <input type="text" hidden name="email" value={selectedRecipient} />
    </form>

    <div class="modal-action">
      <form method="dialog" class="flex gap-2">
        <button class="btn">Cancel</button>
        <button
          class="btn btn-error"
          form="remove_email_alias"
          onclick={() => removeDialog.close()}
        >
          Delete
        </button>
      </form>
    </div>
  </div>
</dialog>
