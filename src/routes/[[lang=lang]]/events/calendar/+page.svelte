<script lang="ts">
  import Calendar from "./Calendar.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Kalender | D-sektionen</title>
</svelte:head>

<Calendar events={data.events} />
