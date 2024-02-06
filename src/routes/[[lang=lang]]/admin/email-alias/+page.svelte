<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { superForm } from "sveltekit-superforms/client";

  export let data;

  const {
    form: createEmailPositionForm,
    errors: createEmailPositionErrors,
    constraints: createEmailPositionConstraints,
    enhance: createEmailPositionEnhance,
  } = superForm(data.createEmailPositionForm);

  const {
    form: createEmailSpecialSenderForm,
    errors: createEmailSpecialSenderErrors,
    constraints: createEmailSpecialSenderConstraints,
    enhance: createEmailSpecialSenderEnhance,
  } = superForm(data.createEmailSpecialSenderForm);

  const {
    form: createEmailSpecialReceiverForm,
    errors: createEmailSpecialReceiverErrors,
    constraints: createEmailSpecialReceiverConstraints,
    enhance: createEmailSpecialReceiverEnhance,
  } = superForm(data.createEmailSpecialReceiverForm);

  const domains = data.domains.map((d) => d);
  const positions = data.positions;
  $: grouped = Array.from(
    data.emailAliases.reduce((acc, emailAlias) => {
      if (!acc.has(emailAlias.email)) {
        acc.set(emailAlias.email, []);
      }
      acc.get(emailAlias.email)?.push(emailAlias.positionId);
      return acc;
    }, new Map<string, string[]>()),
  );
</script>

<PageHeader title="Mejlalias" />

<div>
  <div class="my-4 rounded-lg p-4">
    <div class="border-b border-neutral p-4">
      <h2 class="text-lg font-semibold">Lägg till mejlalias</h2>
      <form
        class="flex flex-row items-end gap-2"
        use:createEmailPositionEnhance
        action="?/createEmailPosition"
        name="createEmailPosition"
        method="POST"
      >
        <Input
          name="localPart"
          id="localPart"
          label="Email"
          required
          bind:value={$createEmailPositionForm.localPart}
          {...$createEmailPositionConstraints.localPart}
          error={$createEmailPositionErrors.localPart}
        />
        <Labeled
          label="Domain"
          id="domain"
          error={$createEmailPositionErrors.domain}
        >
          <select
            id="domain"
            name="domain"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailPositionForm.domain}
            {...$createEmailPositionConstraints.domain}
            required
          >
            {#each domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Labeled label="Post" id="positionId">
          <select
            id="positionId"
            name="positionId"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailPositionForm.positionId}
            {...$createEmailPositionConstraints.positionId}
            required
          >
            {#each positions as position (position.id)}
              <option value={position.id}>{position.name}</option>
            {/each}
          </select>
        </Labeled>
        <button class="btn btn-primary" type="submit">Lägg till</button>
      </form>
    </div>

    <div class="border-b border-neutral p-4">
      <h2 class="text-lg font-semibold">Add Special Sender</h2>
      <form
        class="flex flex-row items-end gap-2"
        action="?/createEmailSpecialSender"
        name="createEmailSpecialSender"
        method="POST"
        use:createEmailSpecialSenderEnhance
      >
        <Input
          name="localPartSender"
          label="Email"
          id="localPart"
          required
          bind:value={$createEmailSpecialSenderForm.localPart}
          {...$createEmailSpecialSenderConstraints.localPart}
          error={$createEmailSpecialSenderErrors.localPart}
        />
        <Labeled
          label="Domain"
          id="domain"
          error={$createEmailSpecialSenderErrors.domain}
        >
          <select
            id="domain"
            name="domainSender"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailSpecialSenderForm.domain}
            {...$createEmailSpecialSenderConstraints.domain}
            required
          >
            {#each domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Input
          name="username"
          label="Username"
          required
          id="username"
          bind:value={$createEmailSpecialSenderForm.username}
          {...$createEmailSpecialSenderConstraints.username}
          error={$createEmailSpecialSenderErrors.username}
        />
        <Input
          name="keycloakId"
          label="Keycloak-ID"
          required
          id="keycloakId"
          bind:value={$createEmailSpecialSenderForm.keycloakId}
          {...$createEmailSpecialSenderConstraints.keycloakId}
          error={$createEmailSpecialSenderErrors.keycloakId}
        />

        <button class="btn btn-primary" type="submit">Lägg till</button>
      </form>
    </div>

    <div class="p-4">
      <h2 class="text-lg font-semibold">Add Special Receiver</h2>
      <form
        class="flex flex-row items-end gap-2"
        action="?/createEmailSpecialReceiver"
        name="createEmailSpecialReceiver"
        method="POST"
        use:createEmailSpecialReceiverEnhance
      >
        <Input
          name="localPart"
          label="Email"
          required
          id="localPart"
          bind:value={$createEmailSpecialReceiverForm.localPart}
          {...$createEmailSpecialReceiverConstraints.localPart}
          error={$createEmailSpecialReceiverErrors.localPart}
        />
        <Labeled
          label="Domain"
          id="domain"
          error={$createEmailSpecialReceiverErrors.domain}
        >
          <select
            id="domain"
            name="domain"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailSpecialReceiverForm.domain}
            {...$createEmailSpecialReceiverConstraints.domain}
            required
          >
            {#each domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Input
          name="targetEmail"
          label="Target Email"
          required
          id="targetEmail"
          bind:value={$createEmailSpecialReceiverForm.targetEmail}
          {...$createEmailSpecialReceiverConstraints.targetEmail}
          error={$createEmailSpecialReceiverErrors.targetEmail}
        />
        <button class="btn btn-primary" type="submit">Lägg till</button>
      </form>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="table">
      <!-- head -->
      <thead>
        <tr class="bg-base-200">
          <th>E-mail</th>
          <th>Position-id</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {#each grouped as emailAlias}
          <tr>
            <td class="font-medium">{emailAlias[0]}</td>
            <td>
              {#each emailAlias[1] as positionId, i}
                {#if i > 0}
                  ,&nbsp;
                {/if}
                <span class="font-mono">{positionId}</span>
              {/each}
            </td>
            <td class="text-right">
              <a class="btn btn-xs px-8" href="email-alias/{emailAlias[0]}"
                >Ändra</a
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
