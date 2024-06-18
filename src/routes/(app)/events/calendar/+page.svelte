<script lang="ts">
  import Calendar from "./Calendar.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>{m.events_calendar()} | D-sektionen</title>
</svelte:head>

<a class="btn" href="/events">
  <span class="i-mdi-format-list-bulleted" />
  {m.events_calendar_list()}
</a>
<Calendar events={data.events} />
