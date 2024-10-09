<script lang="ts">
  import { type Infer, type SuperValidated } from "sveltekit-superforms";
  import type { BookingSchema } from "./schema";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { Bookable } from "@prisma/client";

  export let data: {
    form: SuperValidated<Infer<BookingSchema>>;
    bookables: Bookable[];
  };

  const { form, errors, enhance, constraints } = superForm(data.form);
  export let mode: "create" | "edit" = "create";

  let start = $form.start;
  let end = $form.end;

  // Ensure that the start date is always before the end date
  function handleStartChange() {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000,
      );
      const localEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000,
      );

      if (localStartDate >= localEndDate) {
        localEndDate.setTime(localStartDate.getTime() + 3600000); // Add 1 hour because that is the most likely duration
        end = localEndDate.toISOString().slice(0, 16);
        $form.end = end;
      }
    }
  }

  // Ensure that the end date is always after the start date
  function handleEndChange() {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000,
      );
      const localEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000,
      );

      if (localEndDate <= localStartDate) {
        localStartDate.setTime(localEndDate.getTime() - 3600000); // Subtract 1 hour because that is the most likely duration
        start = localStartDate.toISOString().slice(0, 16);
        $form.start = start;
      }
    }
  }
</script>

<form method="POST" use:enhance class="form-control mx-auto max-w-5xl gap-4">
  <fieldset
    class="input-bordered grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-4 gap-y-2 rounded-xl border px-6 py-2"
    class:border-error={$errors.bookables?._errors ?? 0 > 0}
  >
    <legend class="text-xl font-bold">{m.booking_booking()}</legend>
    {#each data.bookables as bookable}
      <label class="label input-bordered cursor-pointer rounded-lg border px-4">
        <span class="label-text">{bookable.name}</span>
        <input
          type="checkbox"
          class="checkbox"
          name="bookables"
          value={bookable.id}
          bind:group={$form.bookables}
        />
      </label>
    {/each}
  </fieldset>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_from()}</span>
    <input
      type="datetime-local"
      name="start"
      placeholder="Start"
      class="input input-bordered w-full"
      bind:value={start}
      on:change={handleStartChange}
      {...$constraints.start}
    />
  </label>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_until()}</span>
    <input
      type="datetime-local"
      name="end"
      placeholder="End"
      class="input input-bordered w-full"
      class:border-error={$errors.end}
      bind:value={end}
      on:change={handleEndChange}
      {...$constraints.end}
    />
  </label>

  <label>
    <span class="label-text ml-2 font-bold">{m.booking_event()}</span>
    <input
      type="text"
      name="name"
      class="input input-bordered w-full"
      bind:value={$form.name}
      {...$constraints.name}
    />
  </label>

  <div class="flex *:flex-1">
    <a class="btn" href="/booking">{m.booking_goBack()}</a>
    {#if mode === "edit"}
      <button class="btn btn-primary">{m.save()}</button>
    {:else if mode === "create"}
      <button class="btn btn-primary">{m.booking_create()}</button>
    {/if}
  </div>
</form>
