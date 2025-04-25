<script lang="ts">
  import EventPage from "../EventPage.svelte";

  let { data } = $props();
</script>

<EventPage {data} />
