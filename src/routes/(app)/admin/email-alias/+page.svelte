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

  $: groupedEmailAliases = Array.from(
    data.emailAliases.reduce((acc, emailAlias) => {
      if (!acc.has(emailAlias.email)) {
        acc.set(emailAlias.email, []);
      }
      acc.get(emailAlias.email)?.push(emailAlias.positionId);
      return acc;
    }, new Map<string, string[]>()),
  );
  $: groupedSpecialReceivers = Array.from(
    data.specialReceivers.reduce((acc, emailSpecialReceiver) => {
      if (!acc.has(emailSpecialReceiver.email)) {
        acc.set(emailSpecialReceiver.email, []);
      }
      acc
        .get(emailSpecialReceiver.email)
        ?.push(emailSpecialReceiver.targetEmail);
      return acc;
    }, new Map<string, string[]>()),
  );
  $: groupedSpecialSenders = Array.from(
    data.specialSenders.reduce((acc, emailSpecialSender) => {
      if (!acc.has(emailSpecialSender.email)) {
        acc.set(emailSpecialSender.email, []);
      }
      acc.get(emailSpecialSender.email)?.push({
        studentId: emailSpecialSender.studentId,
        keycloakId: emailSpecialSender.keycloakId,
      });
      return acc;
    }, new Map<string, Array<{ studentId: string; keycloakId: string | null }>>()),
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
          name="localPartAlias"
          id="localPartAlias"
          label="Email"
          required
          bind:value={$createEmailPositionForm.localPartAlias}
          {...$createEmailPositionConstraints.localPartAlias}
          error={$createEmailPositionErrors.localPartAlias}
        />
        <Labeled
          label="Domain"
          id="domainAlias"
          error={$createEmailPositionErrors.domainAlias}
        >
          <select
            id="domainAlias"
            name="domainAlias"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailPositionForm.domainAlias}
            {...$createEmailPositionConstraints.domainAlias}
            required
          >
            {#each data.domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Labeled label="Post" id="positionIdAlias">
          <select
            id="positionIdAlias"
            name="positionIdAlias"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailPositionForm.positionIdAlias}
            {...$createEmailPositionConstraints.positionIdAlias}
            required
          >
            {#each data.positions as position (position.id)}
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
          id="localPartSender"
          required
          bind:value={$createEmailSpecialSenderForm.localPartSender}
          {...$createEmailSpecialSenderConstraints.localPartSender}
          error={$createEmailSpecialSenderErrors.localPartSender}
        />
        <Labeled
          label="Domain"
          id="domainSender"
          error={$createEmailSpecialSenderErrors.domainSender}
        >
          <select
            id="domainSender"
            name="domainSender"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailSpecialSenderForm.domainSender}
            {...$createEmailSpecialSenderConstraints.domainSender}
            required
          >
            {#each data.domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Input
          name="usernameSender"
          label="Student ID or Username"
          required
          id="usernameSender"
          bind:value={$createEmailSpecialSenderForm.usernameSender}
          {...$createEmailSpecialSenderConstraints.usernameSender}
          error={$createEmailSpecialSenderErrors.usernameSender}
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
          name="localPartReceiver"
          label="Email"
          required
          id="localPartReceiver"
          bind:value={$createEmailSpecialReceiverForm.localPartReceiver}
          {...$createEmailSpecialReceiverConstraints.localPartReceiver}
          error={$createEmailSpecialReceiverErrors.localPartReceiver}
        />
        <Labeled
          label="Domain"
          id="domainReceiver"
          error={$createEmailSpecialReceiverErrors.domainReceiver}
        >
          <select
            id="domainReceiver"
            name="domainReceiver"
            class="select select-bordered w-full max-w-xs"
            bind:value={$createEmailSpecialReceiverForm.domainReceiver}
            {...$createEmailSpecialReceiverConstraints.domainReceiver}
            required
          >
            {#each data.domains as domain}
              <option value={domain}>{domain}</option>
            {/each}
          </select>
        </Labeled>
        <Input
          name="targetEmailReceiver"
          label="Target Email"
          required
          id="targetEmailReceiver"
          bind:value={$createEmailSpecialReceiverForm.targetEmailReceiver}
          error={$createEmailSpecialReceiverErrors.targetEmailReceiver}
          {...$createEmailSpecialReceiverConstraints.targetEmailReceiver}
        />
        <button class="btn btn-primary" type="submit">Lägg till</button>
      </form>
    </div>
  </div>

  <div class="overflow-x-auto">
    <h1 class="my-4 text-2xl font-bold">Email-alias</h1>
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
        {#each groupedEmailAliases as emailAlias}
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
  <hr />
  <div class="overflow-x-auto">
    <h1 class="my-4 text-2xl font-bold">Special senders</h1>
    <table class="table">
      <!-- head -->
      <thead>
        <tr class="bg-base-200">
          <th>E-mail</th>
          <th>Student ID or Username</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {#each groupedSpecialSenders as { 0: email, 1: ids }}
          <tr>
            <td class="font-medium">{email}</td>
            <td>
              {#each ids as { studentId }, i}
                {#if i > 0}
                  ,&nbsp;
                {/if}
                <span class="font-mono">{studentId}</span>
              {/each}
            </td>

            <td class="text-right">
              <a class="btn btn-xs px-8" href="email-alias/{email}">Ändra</a
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <hr />
  <div class="overflow-x-auto">
    <h1 class="my-4 text-2xl font-bold">Special receivers</h1>
    <table class="table">
      <!-- head -->
      <thead>
        <tr class="bg-base-200">
          <th>E-mail</th>
          <th>Target email</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {#each groupedSpecialReceivers as { 0: email, 1: targetEmails }}
          <tr>
            <td class="font-medium">{email}</td>
            <td>
              {#each targetEmails as targetEmail, i}
                {#if i > 0}
                  ,&nbsp;
                {/if}
                <span class="font-mono">{targetEmail}</span>
              {/each}
            </td>
            <td class="text-right">
              <a class="btn btn-xs px-8" href="email-alias/{email}">Ändra</a
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <hr />
</div>
