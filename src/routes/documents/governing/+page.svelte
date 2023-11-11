<script>
  import File from "../File.svelte";
  export let data;
  $: policies = data.governingDocuments.filter((doc) => doc.documentType === "POLICY");
  $: guidelines = data.governingDocuments.filter((doc) => doc.documentType === "GUIDELINE");
</script>

<svelte:head>
  <title>Styrdokument | D-sektionen</title>
</svelte:head>

<h1 class="my-3 text-2xl font-bold">Styrdokument</h1>
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
          <File name={policy.title} url={policy.url} host />
        {/each}
      </div>
    </div>
    <div>
      <h1 class="my-3 text-2xl font-bold">Riktlinjer</h1>
      <div class="flex flex-col gap-5">
        {#each guidelines as guideline}
          <File name={guideline.title} url={guideline.url} host />
        {/each}
      </div>
    </div>
  </div>
</div>
