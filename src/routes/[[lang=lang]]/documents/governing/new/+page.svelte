<script lang="ts">
  import GoverningDocumentEditor from "../GoverningDocumentEditor.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<GoverningDocumentEditor isCreating documentId={undefined} data={data.form} />
