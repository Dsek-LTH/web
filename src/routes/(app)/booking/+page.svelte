<script lang="ts">
  import Calendar from "./Calendar.svelte";

  export let data;
</script>

<Calendar bookingRequests={data.bookingRequests} />
