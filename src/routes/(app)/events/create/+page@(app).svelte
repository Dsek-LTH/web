<script lang="ts">
  import EventCreator from "./EventCreator.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>{m.events_createEvent()} | D-sektionen</title>
</svelte:head>

<EventCreator data={data.form} allTags={data.allTags} />
