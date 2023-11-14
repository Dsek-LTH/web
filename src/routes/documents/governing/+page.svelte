<script>
  import apiNames from "$lib/utils/apiNames";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import File from "../File.svelte";
  export let data;
  let isEditing = false;
  $: policies = data.governingDocuments.filter((doc) => doc.documentType === "POLICY");
  $: guidelines = data.governingDocuments.filter((doc) => doc.documentType === "GUIDELINE");
</script>

<svelte:head>
  <title>Styrdokument | D-sektionen</title>
</svelte:head>

<h1 class="my-3 text-2xl font-bold">Styrdokument</h1>
{#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE)}
  {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.CREATE)}
    <a class="btn btn-primary btn-sm" href="/documents/governing/new"> + Skapa ny </a>
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
<div class="flex flex-col gap-5">
  <p>
    Här finns alla styrdokument som gäller för D-sektionen. Styrdokumenten är uppdelade i tre
    kategorier: Styrdokument, Reglemente och Policy. Styrdokument är de dokument som styr hur
    sektionen ska fungera. Reglemente är de dokument som styr hur sektionens organ ska fungera.
    Policy är de dokument som styr hur sektionen ska förhålla sig till olika frågor.
  </p>
  <p>
    Om du har några frågor eller funderingar kring styrdokumenten kan du kontakta
    <a
      href="mailto:styrelsen@dsek.se"
      class="link-primary link no-underline hover:underline
    ">styrelsen@dsek.se</a
    >
  </p>
  <div class="flex gap-1">
    <File name="Stadgar" url="https://dsek.se/stadgar" />
    <File name="Reglemente" url="https://dsek.se/reglemente" />
  </div>
  <div class="flex flex-col gap-4 md:flex-row">
    <div>
      <h1 class="my-3 text-2xl font-bold">Policyer</h1>
      <div class="flex flex-col gap-5">
        {#each policies as policy}
          <div class="flex gap-1">
            <File name={policy.title} url={policy.url} host />
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE) && isEditing}
              <DeleteFileForm fileId={policy.id} fileName={policy.title} />
            {/if}
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.UPDATE) && isEditing}
              <a
                class="btn btn-secondary btn-sm pointer-events-auto"
                href={`/documents/governing/${policy.id}/edit`}>Edit</a
              >
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h1 class="my-3 text-2xl font-bold">Riktlinjer</h1>
      <div class="flex flex-col gap-5">
        {#each guidelines as guideline}
          <div class="flex gap-1">
            <File name={guideline.title} url={guideline.url} host />
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.DELETE) && isEditing}
              <DeleteFileForm fileId={guideline.id} fileName={guideline.title} />
            {/if}
            {#if data.accessPolicies.includes(apiNames.GOVERNING_DOCUMENT.UPDATE) && isEditing}
              <a
                class="btn btn-secondary btn-sm pointer-events-auto"
                href={`/documents/governing/${guideline.id}/edit`}>Edit</a
              >
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
