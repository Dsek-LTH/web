<script lang="ts">
  import type { BookingRequest } from "@prisma/client";
  export let bookingRequests: BookingRequest[] = [];
</script>

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
    {#each bookingRequests as bookingRequest}
      {bookingRequest.id}
    {/each}
  </tbody>
</table>
