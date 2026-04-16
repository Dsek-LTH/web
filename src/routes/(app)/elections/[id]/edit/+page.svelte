<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ElectionEditor from "../../ElectionEditor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<SetPageTitle title={data.form.data.markdownSv} />
<ElectionEditor isCreating={false} {data} />
