<script lang="ts">
  import { page } from "$app/state";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import GoverningDocumentEditor from "../../GoverningDocumentEditor.svelte";

  import type { PageData } from "./$types";
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<SetPageTitle title={data.form.data.title} />

<GoverningDocumentEditor
  isCreating={false}
  data={data.form}
  documentId={page.params["id"]}
/>
