<script lang="ts">
  import type { PageData } from "./$types";
  import { superForm } from "sveltekit-superforms/client";
  export let data: PageData;

  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<form method="POST" use:enhance class="form-control mx-auto max-w-sm gap-4">
  <a class="btn" href="/booking">
    <span class="i-mdi-arrow-expand-left" />
    Tillbaka
  </a>

  <fieldset
    class="input-bordered rounded-xl border px-6 py-2"
    class:border-error={$errors.bookables?._errors ?? 0 > 0}
  >
    <legend class="text-xl font-bold">Bokning</legend>
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
    <span class="label-text ml-2 font-bold">Från</span>
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
    <span class="label-text ml-2 font-bold">Till</span>
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
    <span class="label-text ml-2 font-bold">Evenemang</span>
    <input
      type="text"
      name="name"
      class="input input-bordered w-full"
      bind:value={$form.name}
      {...$constraints.name}
    />
  </label>
  <button class="btn btn-primary">Create</button>
</form>
