<script lang="ts">
  import { page } from "$app/stores";
  import GoverningDocumentEditor from "../../GoverningDocumentEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<GoverningDocumentEditor
  isCreating={false}
  data={data.form}
  documentId={$page.params["id"]}
/>
