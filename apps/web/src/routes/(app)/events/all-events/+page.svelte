<script lang="ts">
  import EventList from "../EventList.svelte";

  const { data } = $props();
</script>

<EventList {data} />
