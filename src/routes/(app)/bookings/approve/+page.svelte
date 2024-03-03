<script lang="ts">
  import type { PageData } from "./$types";
  import BookingRequestRow from "./BookingRequestRow.svelte";
  export let data: PageData;
  $: bookingRequests = data.bookingRequests;
  $: filteredRquests = bookingRequests.filter(
    (request) => request.status === "PENDING",
  );
</script>

<div>
  <table class="table">
    <thead>
      <tr>
        <th>Bookable</th>
        <th>Start</th>
        <th>End</th>
        <th>Event</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredRquests as bookingRequest}
        <BookingRequestRow {bookingRequest} />
      {/each}
    </tbody>
  </table>
</div>
