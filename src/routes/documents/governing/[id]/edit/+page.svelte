<script>
  import { page } from "$app/stores";
  import GoverningDocumentEditor from "../../GoverningDocumentEditor.svelte";

  export let data;
</script>

<GoverningDocumentEditor
  isCreating={false}
  data={data.form}
  documentId={$page.params.id}
/>
