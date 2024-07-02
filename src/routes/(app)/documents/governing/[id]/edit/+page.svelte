<script lang="ts">
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import GoverningDocumentEditor from "../../GoverningDocumentEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<SetPageTitle title={data.form.data.title} />

<GoverningDocumentEditor
  isCreating={false}
  data={data.form}
  documentId={$page.params["id"]}
/>
