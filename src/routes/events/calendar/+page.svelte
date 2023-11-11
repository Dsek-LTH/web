<script lang="ts">
  import Calendar from "./Calendar.svelte";

  export let data;
</script>

<Calendar events={data.events} />
