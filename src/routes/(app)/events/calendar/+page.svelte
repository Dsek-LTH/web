<script lang="ts">
  import Calendar from "./Calendar.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Kalender | D-sektionen</title>
</svelte:head>

<a class="btn" href="/events">
  <span class="i-mdi-format-list-bulleted" />
  Lista
</a>
<Calendar events={data.events} />
