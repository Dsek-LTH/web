<script>
  import GoverningDocumentEditor from "../GoverningDocumentEditor.svelte";
  export let data;
</script>

<GoverningDocumentEditor isCreating documentId={undefined} data={data.form} />
