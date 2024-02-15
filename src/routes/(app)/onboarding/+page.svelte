<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import type { UpdateSchema } from "./+page.server";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";
  import { programmes } from "$lib/utils/programmes";
  import { goto } from "$app/navigation";

  export let data: PageData;
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
        <Labeled label="Year" id="classYear" error={$errors.classYear}>
          <input
            type="number"
            name="classYear"
            id="classYear"
            class="input input-bordered"
            bind:value={$form.classYear}
            {...$constraints.classYear}
          />
        </Labeled>
        <div class="flex w-1/2 gap-2 pt-6">
          <button
            name="save"
            type="submit"
            class="btn w-full bg-base-300 text-primary"
          >
            <span class="i-mdi-floppy-disc size-5 bg-primary"></span>
            Spara
          </button>
          <button
            class="btn w-full bg-base-300 text-secondary"
            type="button"
            on:click={() => goto("/")}
          >
            Klar
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
