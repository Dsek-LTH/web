<script lang="ts">
  import { page } from "$app/stores";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import UpdateMailAliasForm from "./EmailAliasForm.svelte";
  import SpecialReceiverForm from "./SpecialReceiverForm.svelte";
  import SpecialSenderForm from "./SpecialSenderForm.svelte";
  import Input from "$lib/components/Input.svelte";

  export let data;
  const { email } = $page.params;
  $: emailAliases = data.emailAlias;
  $: allPositions = data.allPositions;

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

  let isEditing = false;
</script>

<div class="flex flex-row justify-between">
  <PageHeader title={email} />
  <button
    class="btn"
    on:click={() => {
      isEditing = !isEditing;
    }}
  >
    {isEditing ? "Avbryt" : "Redigera"}
  </button>
</div>

<div class="my-8">
  <div class="flex flex-row justify-between">
    <h1 class="text-2xl font-semibold">Aliaset går till följande poster:</h1>
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
      <label for="positionId">Lägg till post:</label>
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
      <button class="btn" type="submit">Lägg till</button>
    </form>

    <form action="?/deleteEmailAlias" method="post" use:deleteEmailAliasEnhance>
      <input type="hidden" name="email" value={email} />
      <button
        class="btn btn-error"
        type="submit"
        disabled={emailAliases.length === 0}>Ta bort alla poster</button
      >
    </form>
  </div>
{/if}

<hr class="my-8" />

<div>
  <div class="flex flex-row justify-between">
    <h1 class="text-2xl font-semibold">
      Följande e-poster är special receivers:
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
          label="E-post"
          bind:value={$addSpecialReceiverForm.targetEmailReceiver}
          required
          error={$addSpecialReceiverErrors.targetEmailReceiver}
        />
        <button class="btn align-bottom" type="submit"> Lägg till </button>
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
          >Ta bort alla special receivers</button
        >
      </form>
    </div>
  {/if}
</div>

<hr class="my-8" />

<div>
  <div class="flex flex-row justify-between">
    <h1 class="py-2 text-2xl font-semibold">
      Följande personer är special senders:
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
        <button class="btn" type="submit"> Lägg till </button>
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
          >Ta bort alla special senders</button
        >
      </form>
    </div>
  {/if}
</div>
