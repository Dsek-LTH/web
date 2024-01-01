<script>
  import apiNames from "$lib/utils/apiNames";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import File from "../File.svelte";
  export let data;
  let isEditing = false;
</script>

<svelte:head>
  <title>Styrdokument | D-sektionen</title>
</svelte:head>

<div
  class="flex w-full flex-row flex-wrap items-center justify-between gap-x-4"
>
  <h1 class="my-3 text-2xl font-bold">Styrdokument</h1>
  <div>
    {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE)}
      {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.CREATE)}
        <a class="btn btn-primary btn-sm" href="/documents/governing/new">
          + Skapa ny
        </a>
      {/if}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isEditing = !isEditing;
        }}
      >
        {isEditing ? "Sluta redigera" : "Redigera"}
      </button>
    {/if}
  </div>
</div>
<div class="flex flex-col gap-5">
  <p>
    Här finns alla styrdokument som gäller för D-sektionen. Styrdokumenten är
    uppdelade i tre kategorier: Styrdokument, Reglemente och Policy.
    Styrdokument är de dokument som styr hur sektionen ska fungera. Reglemente
    är de dokument som styr hur sektionens organ ska fungera. Policy är de
    dokument som styr hur sektionen ska förhålla sig till olika frågor.
  </p>
  <p>
    Om du har några frågor eller funderingar kring styrdokumenten kan du
    kontakta
    <a
      href="mailto:styrelsen@dsek.se"
      class="link link-primary no-underline hover:underline"
    >
      styrelsen@dsek.se
    </a>
  </p>
  <div class="flex items-center gap-5">
    <strong><File name="Stadgar" url="https://dsek.se/stadgar" /></strong>
    <strong><File name="Reglemente" url="https://dsek.se/reglemente" /></strong>
  </div>
  <div class="flex flex-col gap-4 md:flex-row">
    <div>
      <h1 class="my-3 text-2xl font-bold">Policyer</h1>
      <div class="flex flex-col gap-2">
        {#each data.policies as policy}
          <div class="flex items-center gap-1">
            <File name={policy.title} url={policy.url} host />
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE) && isEditing}
              <DeleteFileForm
                fileId={policy.id}
                fileName={policy.title}
                data={data.deleteForm}
              />
            {/if}
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.UPDATE) && isEditing}
              <a
                class="pointer-events-auto"
                href={`/documents/governing/${policy.id}/edit`}
                ><span class="i-mdi-pencil align-middle text-xl text-secondary"
                ></span>
              </a>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h1 class="my-3 text-2xl font-bold">Riktlinjer</h1>
      <div class="flex flex-col gap-2">
        {#each data.guidelines as guideline}
          <div class="flex items-center gap-1">
            <File name={guideline.title} url={guideline.url} host />
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE) && isEditing}
              <DeleteFileForm
                fileId={guideline.id}
                fileName={guideline.title}
                data={data.deleteForm}
              />
            {/if}
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.UPDATE) && isEditing}
              <a
                class="pointer-events-auto"
                href={`/documents/governing/${guideline.id}/edit`}
                ><span class="i-mdi-pencil align-middle text-xl text-secondary"
                ></span>
              </a>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
