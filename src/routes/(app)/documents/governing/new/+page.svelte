<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import GoverningDocumentEditor from "../GoverningDocumentEditor.svelte";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  export let data: PageData;
</script>

<SetPageTitle title={m.documents_governingDocuments()} />

<GoverningDocumentEditor isCreating documentId={undefined} data={data.form} />
