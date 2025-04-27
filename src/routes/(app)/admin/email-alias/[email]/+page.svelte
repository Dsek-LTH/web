<script lang="ts">
  import { page } from "$app/state";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import UpdateMailAliasForm from "./EmailAliasForm.svelte";
  import SpecialReceiverForm from "./SpecialReceiverForm.svelte";
  import SpecialSenderForm from "./SpecialSenderForm.svelte";
  import Input from "$lib/components/Input.svelte";
  import * as m from "$paraglide/messages";

  let { data } = $props();
  const { email } = page.params;
  let emailAliases = $derived(data.emailAlias);
  let allPositions = $derived(data.allPositions);

  const {
    form: addPositionForm,
    constraints: addPositionConstraints,
    enhance: addPositionEnhance,
  } = superForm(data.addPositionForm);
  const {
    form: addSpecialReceiverForm,
    errors: addSpecialReceiverErrors,
    enhance: addSpecialReceiverEnhance,
  } = superForm(data.addSpecialReceiverForm);
  const {
    form: addSpecialSenderForm,
    errors: addSpecialSenderErrors,
    enhance: addSpecialSenderEnhance,
  } = superForm(data.addSpecialSenderForm);

  const { enhance: deleteEmailAliasEnhance } = superForm(
    data.deleteEmailAliasForm,
  );
  const { enhance: deleteSpecialReceiverEnhance } = superForm(
    data.deleteSpecialReceiverForm,
  );
  const { enhance: deleteSpecialSenderEnhance } = superForm(
    data.deleteSpecialSenderForm,
  );

  let isEditing = $state(false);
</script>

<div class="flex flex-row justify-between">
  <PageHeader title={email} />
  <button
    class="btn"
    onclick={() => {
      isEditing = !isEditing;
    }}
  >
    {isEditing ? m.admin_emailalias_cancel() : m.admin_emailalias_edit()}
  </button>
</div>

<div class="my-8">
  <div class="flex flex-row justify-between">
    <h1 class="text-2xl font-semibold">{m.admin_emailalias_aliasGoesTo()}</h1>
  </div>

  {#each emailAliases as emailAlias (emailAlias.id)}
    <UpdateMailAliasForm
      {isEditing}
      {emailAlias}
      canSendForm={data.setCanSendForm}
      removePositionForm={data.removePositionForm}
    />
  {/each}
</div>

{#if isEditing}
  <div class="my-2 flex flex-row justify-between">
    <form action="?/addPosition" method="post" use:addPositionEnhance>
      <input type="hidden" name="email" value={email} />
      <label for="positionId">{m.admin_emailalias_addPosition()}</label>
      <select
        id="positionId"
        name="positionId"
        class="select select-bordered w-full max-w-xs"
        bind:value={$addPositionForm.positionId}
        {...$addPositionConstraints.positionId}
        required
      >
        {#each allPositions as position (position.id)}
          <option value={position.id}>{position.name}</option>
        {/each}
      </select>
      <button class="btn" type="submit">{m.admin_emailalias_add()}</button>
    </form>

    <form action="?/deleteEmailAlias" method="post" use:deleteEmailAliasEnhance>
      <input type="hidden" name="email" value={email} />
      <button
        class="btn btn-error"
        type="submit"
        disabled={emailAliases.length === 0}
        >{m.admin_emailalias_removeAllPositions()}</button
      >
    </form>
  </div>
{/if}

<hr class="my-8" />

<div>
  <div class="flex flex-row justify-between">
    <h1 class="text-2xl font-semibold">
      {m.admin_emailalias_areSpecialReceivers()}
    </h1>
  </div>

  {#each data.specialReceivers as specialReceiver (specialReceiver.id)}
    <SpecialReceiverForm
      {specialReceiver}
      {isEditing}
      removeReceiverForm={data.removeSpecialReceiverForm}
    />
  {/each}

  {#if isEditing}
    <div class="my-2 flex flex-row justify-between">
      <form
        action="?/addSpecialReceiver"
        method="post"
        use:addSpecialReceiverEnhance
      >
        <input type="hidden" name="email" value={email} />
        <Input
          name="targetEmailReceiver"
          label={m.admin_emailalias_emailAddress()}
          bind:value={$addSpecialReceiverForm.targetEmailReceiver}
          required
          error={$addSpecialReceiverErrors.targetEmailReceiver}
        />
        <button class="btn align-bottom" type="submit"
          >{m.admin_emailalias_add()}</button
        >
      </form>
      <form
        action="?/deleteSpecialReceiver"
        method="post"
        use:deleteSpecialReceiverEnhance
      >
        <input type="hidden" name="email" value={email} />
        <button
          class="btn btn-error"
          type="submit"
          disabled={data.specialReceivers.length === 0}
          >{m.admin_emailalias_removeAllSpecialReceivers()}</button
        >
      </form>
    </div>
  {/if}
</div>

<hr class="my-8" />

<div>
  <div class="flex flex-row justify-between">
    <h1 class="py-2 text-2xl font-semibold">
      {m.admin_emailalias_areSpecialSenders()}
    </h1>
  </div>

  {#each data.specialSenders as specialSender (specialSender.id)}
    <SpecialSenderForm
      {specialSender}
      {isEditing}
      removeSenderForm={data.removeSpecialSenderForm}
    />
  {/each}

  {#if isEditing}
    <div class="my-2 flex flex-row justify-between">
      <form
        action="?/addSpecialSender"
        method="post"
        use:addSpecialSenderEnhance
      >
        <input type="hidden" name="email" value={email} />
        <div>
          <Input
            name="usernameSender"
            label="Username/studentId"
            bind:value={$addSpecialSenderForm.usernameSender}
            required
            error={$addSpecialSenderErrors.usernameSender}
          />
        </div>
        <button class="btn" type="submit">{m.admin_access_add()}</button>
      </form>

      <form
        action="?/deleteSpecialSender"
        method="post"
        use:deleteSpecialSenderEnhance
      >
        <input type="hidden" name="email" value={email} />
        <button
          class="btn btn-error"
          type="submit"
          disabled={data.specialSenders.length === 0}
          >{m.admin_emailalias_removeAllSpecialSenders()}</button
        >
      </form>
    </div>
  {/if}
</div>
