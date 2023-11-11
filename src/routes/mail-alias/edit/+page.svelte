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

<h1 class="m-8 text-2xl font-bold">Ändra mejlalias</h1>

<div>
  <div class="rounded-lg p-4 shadow shadow-black">
    <h2>Lägg till mejlalias</h2>
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

  <div class="rounded-lg p-4 shadow shadow-black">
    <h2>Add Special Sender</h2>
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

  <div class="rounded-lg p-4 shadow shadow-black">
    <h2>Add Special Receiver</h2>
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

  <div class="p-4"></div>

  {#each data.emailAliases.map((e) => e.email) as mail}
    <div>
      <div class="rounded-lg p-4 shadow shadow-black">
        <li class="flex justify-between">
          <div>
            <span class="i-mdi-wand"></span>
            {mail}
          </div>
          <button>
            <span class="i-mdi-wrench"> </span>
          </button>
        </li>
      </div>
    </div>
  {/each}
</div>
