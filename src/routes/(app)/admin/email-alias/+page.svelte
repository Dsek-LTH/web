<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { emailAliasSchema } from "./helpers";
  import { enhance } from "$app/forms";

  const { data } = $props();

  const {
    form,
    enhance: superEnhance,
    errors,
  } = superForm(data.form, {
    validators: zodClient(emailAliasSchema),
  });

  let createDialog: HTMLDialogElement;
  let removeDialog: HTMLDialogElement;
  let selectedEmailAlias: (typeof data)["emailAliases"][number] | undefined =
    $state();
</script>

<SetPageTitle title="Email aliases" />

<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr class="bg-base-200">
        <th>{m.emailAliases()}</th>
        <th>Mottagare</th>
        <th>
          <button
            class="btn btn-primary btn-xs float-right px-4"
            onclick={() => createDialog.showModal()}
          >
            <span class="i-mdi-add"></span>
            {m.admin_emailalias_add()}
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each data.emailAliases as emailAlias}
        {@const { mail: email, recipients = [] } = emailAlias}
        <tr>
          <td class="font-medium">{email}</td>
          <td>
            {#if recipients.length >= 2}
              {recipients[0]}
              and
              <a href="email-alias/{email}" class="link">
                {recipients.length - 1} more
              </a>
            {:else if recipients.length === 1}
              {recipients[0]}
            {/if}
          </td>
          <td class="flex justify-end gap-2">
            <a class="btn btn-outline btn-xs px-8" href="email-alias/{email}">
              {m.admin_emailalias_edit()}
            </a>

            <button
              class="btn btn-square btn-outline btn-xs"
              aria-label="delete"
              onclick={() => {
                removeDialog.showModal();
                selectedEmailAlias = emailAlias;
              }}
            >
              <span class="i-mdi-delete"></span>
            </button>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="2" class="text-center">No email aliases found.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Dialog for creating a new email alias -->
<dialog class="modal modal-bottom sm:modal-middle" bind:this={createDialog}>
  <div class="modal-box flex flex-col gap-4">
    <h3 class="text-lg font-bold">Create an email alias</h3>
    <p>Enter the email alias you'd like to create.</p>
    <form
      class="join w-full *:input-bordered"
      class:*:input-error={$errors.alias}
      id="create_email_alias"
      method="POST"
      action="?/create"
      use:superEnhance
    >
      <label class="input join-item flex w-full items-center gap-2">
        <span class="i-mdi-email"></span>
        <input
          class="w-full"
          type="text"
          placeholder="naringsliv"
          name="alias"
          required
          bind:value={$form.alias}
        />
      </label>

      <select
        class="join-item select"
        name="domain"
        bind:value={$form.domain}
        required
      >
        <option value="dsek.se">@dsek.se</option>
        <option value="nolla.nu">@nolla.nu</option>
        <option value="teknikfokus.se">@teknikfokus.se</option>
        <option value="dchip.se">@dchip.se</option>
      </select>
    </form>

    {#if $errors.alias}
      <p class="text-error">{$errors.alias}</p>
    {/if}

    <p>You'll be able to add recipients to the group next.</p>

    <div class="modal-action">
      <form method="dialog" class="flex gap-2">
        <button class="btn">Cancel</button>
        <button class="btn btn-primary" form="create_email_alias">
          Create
        </button>
      </form>
    </div>
  </div>
</dialog>

<!-- Dialog for removing email alias -->
<dialog class="modal modal-bottom sm:modal-middle" bind:this={removeDialog}>
  <div class="modal-box flex flex-col gap-4">
    <h3 class="text-lg font-bold">Delete email alias</h3>
    <p>Are you sure you want to remove <b>{selectedEmailAlias?.mail}</b>?</p>

    <form
      action="?/delete"
      method="POST"
      use:enhance
      class="hidden"
      id="remove_email_alias"
    >
      <input type="text" hidden name="id" value={selectedEmailAlias?.id} />
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
