<script>
  export let data;
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  const domains = [
    "@dsek.se",
    "@nolla.nu",
    "@yrka.nu",
    "@teknikfokus.se",
    "@juble.se",
    "@geekend.se",
  ];
</script>

<h1 class="text-2xl font-bold">Ändra mejlalias</h1>

<div>
  <div class="my-4 rounded-lg p-4 shadow shadow-black">
    <div class="border-b border-neutral p-4">
      <h2 class="text-lg font-semibold">Lägg till mejlalias</h2>
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
        <Labeled label="Roll" id="classProgramme">
          <select
            id="classProgramme"
            name="classProgramme"
            class="select select-bordered w-full max-w-xs"
            value={null}
            required
          >
            {#each data.positions as position (position.id)}
              <option value={position.id}>{position.name}</option>
            {/each}
          </select>
        </Labeled>
        <button class="btn btn-primary">Lägg till</button>
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
            <td class="text-right"><a class="btn btn-xs px-8" href="access/{mail}">Edit</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
