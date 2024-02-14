<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import type { UpdateSchema } from "./+page.server";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";
  import { programmes } from "$lib/utils/programmes";

  export let data: PageData;
  const currentYear = new Date().getFullYear();
  const years: number[] = Array.from(
    { length: currentYear - 1961 + 1 },
    (value, index) => 2024 - index,
  );
  const { form, errors, constraints, enhance } = superForm<UpdateSchema>(
    data.form,
    {},
  );
</script>

<svelte:head>
  <title>Onboarding | D-sektionen</title>
</svelte:head>

<div class="rounded-lg bg-base-200 p-10">
  <div class="max-w-sm">
    <div class="text-5xl">Welcome</div>
    <div class="text-lg">Fill in your information below</div>

    <form id="edit-member" method="POST" action="?/update" use:enhance>
      <div class="flex flex-col">
        <Input
          name="firstName"
          label="Förnamn"
          bind:value={$form.firstName}
          {...$constraints.firstName}
          error={$errors.firstName}
        />
        <Input
          name="lastName"
          label="Efternamn"
          bind:value={$form.lastName}
          {...$constraints.lastName}
          error={$errors.lastName}
        />
        <Input
          name="pref"
          label="Matpreferens"
          placeholder="Ex. lactos, gluten, mushrooms"
          bind:value={$form.foodPreference}
          {...$constraints.foodPreference}
          error={$errors.foodPreference}
        />
        <Labeled
          label="Program"
          id="classProgramme"
          error={$errors.classProgramme}
        >
          <select
            id="classProgramme"
            name="classProgramme"
            class="select select-bordered w-full max-w-xs"
            bind:value={$form.classProgramme}
            {...$constraints.classProgramme}
          >
            {#each programmes as programme (programme.id)}
              <option value={programme.id}>{programme.name}</option>
            {/each}
          </select>
        </Labeled>
        <Labeled label="År" id="classYear" error={$errors.classProgramme}>
          <select
            id="classYear"
            name="classYear"
            class="select select-bordered w-full max-w-xs"
            bind:value={$form.classYear}
            {...$constraints.classProgramme}
          >
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </Labeled>
        <div class="pt-6">
          <button
            name="save"
            type="submit"
            class="btn bg-base-300 text-primary"
          >
            <span class="i-mdi-floppy-disc size-5 bg-primary"></span>
            Spara
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
