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
</script>

<form method="POST" use:enhance class="form-control mx-auto max-w-5xl gap-4">
  <fieldset
    class="input-bordered grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-4 rounded-xl border px-6 py-2"
    class:border-error={$errors.bookables?._errors ?? 0 > 0}
  >
    <legend class="text-xl font-bold">{m.booking_booking()}</legend>
    {#each data.bookables as bookable}
      <label class="label cursor-pointer">
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
      bind:value={$form.start}
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
      bind:value={$form.end}
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
    <button class="btn btn-primary">{m.booking_create()}</button>
  </div>
</form>
