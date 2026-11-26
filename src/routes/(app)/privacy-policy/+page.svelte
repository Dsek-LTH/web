<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { getPdfApiUrl } from "$lib/utils/servePdf";
  import * as m from "$paraglide/messages";
  import ExternalLink from "@lucide/svelte/icons/external-link";

  // The policy is a governing document maintained in the styrdokument repository.
  const policyUrl = getPdfApiUrl(
    "styrdokument/releases/download/latest/policy-for-hantering-av-personuppgifter.pdf",
  );
</script>

<div class="layout-container flex flex-col gap-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-2xl font-bold">{m.privacy_policy()}</h1>

    <Button href={policyUrl} target="_blank" rel="noopener" variant="outline">
      <ExternalLink class="size-4" />
      {m.privacy_policy_openPdf()}
    </Button>
  </div>

  <object
    data={policyUrl}
    type="application/pdf"
    title={m.privacy_policy()}
    class="h-[80vh] w-full rounded-md border"
  >
    <p>
      {m.privacy_policy_pdfNotSupported()}
      <a class="link" href={policyUrl}>{m.privacy_policy_openPdf()}</a>
    </p>
  </object>
</div>
