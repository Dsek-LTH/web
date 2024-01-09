<script lang="ts">
  import Calendar from "./Calendar.svelte";

  export let data;
</script>

<svelte:head>
  <title>Kalender | D-sektionen</title>
</svelte:head>

<Calendar events={data.events} />
