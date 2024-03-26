<script lang="ts">
  import type { Bookable, BookingRequest } from "@prisma/client";
  import dayjs from "dayjs";

  type T = BookingRequest & { bookables: Bookable[] };
  export let bookingRequest: T;
  export let bookingRequests: T[];
  $: otherBookingRequests = bookingRequests.filter(
    (br) => br.id !== bookingRequest.id && br.status !== "DENIED",
  );

  $: start = dayjs(bookingRequest.start);
  $: end = dayjs(bookingRequest.end);
  $: conflict = otherBookingRequests.find(
    (br) =>
      dayjs(br.start).isBefore(end) &&
      dayjs(br.end).isAfter(start) &&
      br.bookables.some((ba) =>
        bookingRequest.bookables.map((ba2) => ba2.id).includes(ba.id),
      ),
  );
  $: conflictingBookables = conflict?.bookables
    .filter((b) => bookingRequest.bookables.map((ba) => ba.id).includes(b.id))
    .map((b) => b.name)
    .join(", ");
  $: conflictError =
    bookingRequest.status !== "DENIED" && conflict?.status === "ACCEPTED";
  $: conflictWarning = conflict && !conflictError;
</script>

<div class="flex flex-col gap-1">
  {#if bookingRequest.status === "ACCEPTED"}
    <div class="badge badge-success">
      <span class="i-mdi-check-circle mr-1" /> Godkänd
    </div>
  {:else if bookingRequest.status === "DENIED"}
    <div class="badge badge-error">
      <span class="i-mdi-denied mr-1" /> Nekad
    </div>
  {:else if bookingRequest.status === "PENDING"}
    <div class="badge badge-info">
      <span class="i-mdi-hourglass mr-1" /> Väntar
    </div>
  {/if}

  {#if conflict}
    <div
      class="badge"
      class:badge-error={conflictError}
      class:badge-secondary={conflictWarning}
    >
      <div
        class="tooltip flex items-center"
        data-tip={`Krock med "${conflict.event}" – ${conflictingBookables}`}
      >
        <span class="i-mdi-info mr-1" /> Konflikt
      </div>
    </div>
  {/if}
</div>
