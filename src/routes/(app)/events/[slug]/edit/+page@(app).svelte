<script lang="ts">
  import EventEditor from "./EventEditor.svelte";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
</script>

<SetPageTitle title="Redigera evenemang" />

<EventEditor data={data.form} allTags={data.allTags} />
