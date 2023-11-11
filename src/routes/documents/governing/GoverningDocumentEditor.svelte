<script lang="ts">
  import type { GoverningDocument } from "@prisma/client";
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  export let governingDocument: GoverningDocument | undefined | null;
  let documentType = governingDocument?.documentType ?? "POLICY";
</script>

<form
  id="governing-document-editor"
  method="POST"
  action={governingDocument ? "?/update" : "?/create"}
  use:enhance
  class="flex flex-col gap-3"
>
  <h1 class="text-2xl font-bold">{governingDocument ? "Redigera" : "Skapa nytt"} styrdokument</h1>
  <Input name="title" label="Titel" required value={governingDocument?.title ?? ""} />
  <input name="id" type="hidden" value={governingDocument?.id} />
  <div class="flex gap-2">
    <input
      value="https://github.com/Dsek-LTH/"
      class="input-border input input-ghost w-full max-w-xs"
      type="text"
      disabled
    />
    <div class="flex w-full flex-col">
      <input
        id="url"
        name="url"
        class="input input-bordered w-full"
        type="text"
        placeholder="Pathname"
        value={governingDocument?.url ?? ""}
        required
      />
      <p class="text-xs">example: reglemente/releases/download/latest/reglemente.pdf</p>
    </div>
  </div>
  <select
    id="documentType"
    name="documentType"
    class="max-w select select-bordered w-full"
    value={documentType}
    required
  >
    <option value="POLICY">Policy</option>
    <option value="GUIDELINE">Riktlinje</option>
  </select>
  <button type="submit" class="btn btn-primary btn-sm mt-4">
    {governingDocument ? "Uppdatera" : "Skapa"}
  </button>
</form>
