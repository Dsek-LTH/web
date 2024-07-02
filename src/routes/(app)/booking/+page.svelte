<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Calendar from "./Calendar.svelte";
  import * as m from "$paraglide/messages";

  export let data;
</script>

<SetPageTitle title={m.bookings()} />

<Calendar bookingRequests={data.bookingRequests} />
