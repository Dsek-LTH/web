<script lang="ts">
  import type { Bookable, BookingRequest } from "@prisma/client";
  import dayjs from "dayjs";
  import * as m from "$paraglide/messages";
  import { twMerge } from "tailwind-merge";

  type T = BookingRequest & { bookables: Bookable[] };
  interface Props {
    bookingRequest: T;
    bookingRequests: T[];
    class?: string | undefined;
  }

  let {
    bookingRequest,
    bookingRequests,
    class: clazz = undefined,
  }: Props = $props();

  let otherBookingRequests = $derived(
    bookingRequests.filter(
      (br) => br.id !== bookingRequest.id && br.status !== "DENIED",
    ),
  );

  let start = $derived(dayjs(bookingRequest.start));
  let end = $derived(dayjs(bookingRequest.end));
  let conflict = $derived(
    otherBookingRequests.find(
      (br) =>
        dayjs(br.start).isBefore(end) &&
        dayjs(br.end).isAfter(start) &&
        br.bookables.some((ba) =>
          bookingRequest.bookables.map((ba2) => ba2.id).includes(ba.id),
        ),
    ),
  );
  let conflictingBookables = $derived(
    conflict?.bookables
      .filter((b) => bookingRequest.bookables.map((ba) => ba.id).includes(b.id))
      .map((b) => b.name)
      .join(", "),
  );
  let conflictError = $derived(
    bookingRequest.status !== "DENIED" && conflict?.status === "ACCEPTED",
  );
  let conflictWarning = $derived(conflict && !conflictError);
</script>

<div class={twMerge("flex gap-1", clazz)}>
  {#if bookingRequest.status === "ACCEPTED"}
    <div class="badge badge-success">
      <span class="i-mdi-check-circle mr-1"></span>{m.booking_accepted()}
    </div>
  {:else if bookingRequest.status === "DENIED"}
    <div class="badge badge-error">
      <span class="i-mdi-denied mr-1"></span>{m.booking_denied()}
    </div>
  {:else if bookingRequest.status === "PENDING"}
    <div class="badge badge-info">
      <span class="i-mdi-hourglass mr-1"></span>{m.booking_pending()}
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
        data-tip={m.booking_conflictWith({
          event: `${conflict.event}`,
          bookables: `${conflictingBookables}`,
        })}
      >
        <span class="i-mdi-info mr-1"></span>{m.booking_conflict()}
      </div>
    </div>
  {/if}
</div>
