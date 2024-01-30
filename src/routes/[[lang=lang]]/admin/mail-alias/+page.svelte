<script>
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

  const domains = [
    "@dsek.se",
    "@nolla.nu",
    "@yrka.nu",
    "@teknikfokus.se",
    "@juble.se",
    "@geekend.se",
  ];
</script>

<PageHeader title="Mailalias" />

<div>
  <div class="my-4 rounded-lg p-4">
    <div class="border-b border-neutral p-4">
      <h2 class="text-lg font-semibold">Lägg till mejlalias</h2>
      <form
        class="flex flex-row items-end gap-2"
        use:createEmailPositionEnhance
        action="?/createEmailPosition"
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
            {#each domains as domain (domain)}
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
      <form class="flex flex-row items-end gap-2">
        <Input name="email" label="Email" required />
        <Labeled label="Domain" id="classProgramme">
          <select
            id="classProgramme"
            name="classProgramme"
            class="select select-bordered w-full max-w-xs"
            value={domains[0]}
            required
          >
            {#each domains as programme (programme)}
              <option value={programme}>{programme}</option>
            {/each}
          </select>
        </Labeled>
        <Input name="username" label="Username" required />
        <Input name="keycloak" label="Keycloak-ID" required />

        <button class="btn btn-primary">Lägg till</button>
      </form>
    </div>

    <div class="p-4">
      <h2 class="text-lg font-semibold">Add Special Receiver</h2>
      <form class="flex flex-row items-end gap-2">
        <Input name="email" label="Email" required />
        <Labeled label="Domain" id="classProgramme">
          <select
            id="classProgramme"
            name="classProgramme"
            class="select select-bordered w-full max-w-xs"
            value={domains[0]}
            required
          >
            {#each domains as programme (programme)}
              <option value={programme}>{programme}</option>
            {/each}
          </select>
        </Labeled>
        <Input name="target" label="Target Email" required />
        <button class="btn btn-primary">Lägg till</button>
      </form>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="table">
      <!-- head -->
      <thead>
        <tr class="bg-base-200">
          <th>E-mail</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {#each data.emailAliases.map((e) => e.email) as mail}
          <tr>
            <td class="font-medium">{mail}</td>
            <td class="text-right"
              ><a class="btn btn-xs px-8" href="access/{mail}">Edit</a></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
