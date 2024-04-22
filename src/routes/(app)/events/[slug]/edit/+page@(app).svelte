<script lang="ts">
  import EventEditor from "./EventEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Redigera evenemang | D-sektionen</title>
</svelte:head>

<EventEditor data={data.form} allTags={data.allTags} />
