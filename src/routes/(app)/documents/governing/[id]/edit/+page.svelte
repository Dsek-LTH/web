<script lang="ts">
  import GoverningDocumentForm from "../../GoverningDocumentForm.svelte";
  import * as m from "$paraglide/messages.js";

  let { data } = $props();
</script>

<GoverningDocumentForm
  form={data.form}
  action="?/update"
  title={m.documents_governing_editDocument()}
  submitLabel={m.documents_governing_update()}
/>
