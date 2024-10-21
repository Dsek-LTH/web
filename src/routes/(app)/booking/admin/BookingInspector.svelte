<script lang="ts">
  import type { Infer, SuperValidated } from "sveltekit-superforms";
  import type { BookingSchema } from "../schema";
  import * as m from "$paraglide/messages";
  import type { Bookable, BookingRequest } from "@prisma/client";
  import { superForm } from "$lib/utils/client/superForms";
  import StatusComponent from "./StatusComponent.svelte";

  type BookingRequestWithBookables = BookingRequest & { bookables: Bookable[] };
  export let data: {
    form: SuperValidated<Infer<BookingSchema>>;
    bookables: Bookable[];
    booking: BookingRequestWithBookables;
    allBookingRequests: BookingRequestWithBookables[];
  };

  $: bookingRequest = data.booking;

  const { form, errors, enhance } = superForm(data.form);
</script>

<div class="form-control mx-auto max-w-5xl gap-4">
  <div class="flex flex-col gap-5">
    <div class="w-fit">
      <a class="btn" href="/booking/admin">
        <span class="i-mdi-arrow-expand-left" />
        {m.booking_goBack()}
      </a>
    </div>
    <StatusComponent
      bind:bookingRequest
      bind:bookingRequests={data.allBookingRequests}
      mode="inspect"
    />
  </div>
  <fieldset
    class="input-bordered grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] rounded-xl border px-6 py-2"
    class:border-error={$errors.bookables?._errors ?? 0 > 0}
  >
    <legend class="text-xl font-bold">{m.booking_booking()}</legend>
    {#each data.bookables as bookable}
      <label class="label cursor-pointer justify-start gap-4 rounded-lg">
        <input
          type="checkbox"
          class="checkbox"
          name="bookables"
          value={bookable.id}
          bind:group={$form.bookables}
          disabled
        />
        <span class="label-text">{bookable.name}</span>
      </label>
    {/each}
  </fieldset>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_from()}</span>
    <input
      type="datetime-local"
      name="start"
      class="input input-bordered w-full"
      bind:value={$form.start}
      disabled
    />
  </label>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_until()}</span>
    <input
      type="datetime-local"
      name="end"
      class="input input-bordered w-full"
      bind:value={$form.end}
      disabled
    />
  </label>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_event()}</span>
    <input
      type="text"
      name="name"
      class="input input-bordered w-full"
      bind:value={$form.name}
      disabled
    />
  </label>

  <form
    method="POST"
    use:enhance
    class="flex *:flex-1"
    id={`form-${bookingRequest.id}`}
  >
    <input hidden name="id" type="text" bind:value={bookingRequest.id} />
    <button
      formaction="?/accept"
      class="btn btn-outline btn-success"
      class:btn-disabled={bookingRequest.status === "ACCEPTED"}
      aria-label={m.booking_accept()}
    >
      {m.booking_accept()}
      <span class="i-mdi-check" />
    </button>
    <button
      formaction="?/reject"
      class="btn btn-outline btn-error"
      class:btn-disabled={bookingRequest.status === "DENIED"}
      aria-label={m.booking_deny()}
    >
      {m.booking_deny()}
      <span class="i-mdi-close" />
    </button>
  </form>
</div>
