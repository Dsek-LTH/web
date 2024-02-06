<script lang="ts">
  import { page } from "$app/stores";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import UpdateMailAliasForm from "./EmailAliasForm.svelte";

  export let data;
  const { email } = $page.params;
  $: emailAliases = data.emailAlias;
  $: allPositions = data.allPositions;

  const {
    form: addPositionForm,
    // errors: addPositionErrors,
    constraints: addPositionConstraints,
    enhance: addPositionEnhance,
  } = superForm(data.addPositionForm);

  const { enhance: deleteEmailAliasEnhance } = superForm(
    data.deleteEmailAliasForm,
  );

  let isEditing = false;
</script>

<PageHeader title={email} />

<div class="flex flex-row justify-between">
  <h1 class="py-2 text-2xl">Aliaset går till följande poster:</h1>

  <button
    class="btn"
    on:click={() => {
      isEditing = !isEditing;
    }}
  >
    {isEditing ? "Avbryt" : "Redigera"}
  </button>
</div>

{#each emailAliases as emailAlias (emailAlias.id)}
  <div class="py-3">
    {#if isEditing}
      <UpdateMailAliasForm
        {emailAlias}
        canSendForm={data.setCanSendForm}
        removePositionForm={data.removePositionForm}
      />
    {:else}
      <div class="flex flex-row gap-6 border-b border-neutral py-4 text-left">
        <h1 class="font-medium">{emailAlias.position.name}</h1>
        <p class="font-mono">{emailAlias.positionId}</p>
        <label for="canSend">Kan skicka? </label>
        <input
          type="checkbox"
          class="toggle toggle-primary pointer-events-none"
          checked={emailAlias.canSend}
        />
      </div>
    {/if}
  </div>
{/each}

{#if isEditing}
  <div class="flex flex-row justify-between py-4">
    <form action="?/addPosition" method="post" use:addPositionEnhance>
      <label for="positionId">Lägg till position:</label>
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
      <button class="btn btn-error" type="submit">Ta bort aliaset</button>
    </form>
  </div>
{/if}
