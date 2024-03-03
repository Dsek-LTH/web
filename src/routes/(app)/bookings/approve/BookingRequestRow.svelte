<script lang="ts">
  import type { BookingRequest, Bookable } from "@prisma/client";
  import StatusComponent from "./StatusComponent.svelte";
  import { enhance } from "$app/forms";

  export let bookingRequest: Bookable[] & BookingRequest;
</script>

<tr>
  <!-- TODO fix type errors -->
  <th>{bookingRequest.bookables.map((a) => a.name)}</th>
  <th>{bookingRequest.start}</th>
  <th>{bookingRequest.end}</th>
  <th>{bookingRequest.event}</th>
  <th><StatusComponent {bookingRequest} /></th>
</tr>
