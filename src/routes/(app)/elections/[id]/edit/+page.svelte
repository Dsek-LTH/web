<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ElectionEditor from "../../ElectionEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<SetPageTitle title={data.form.data.markdown} />
<ElectionEditor isCreating={false} {data} />
