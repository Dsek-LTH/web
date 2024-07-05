<script lang="ts">
  import EventEditor from "./EventEditor.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>{m.events_editEvent} | D-sektionen</title>
</svelte:head>

<EventEditor data={data.form} allTags={data.allTags} />
