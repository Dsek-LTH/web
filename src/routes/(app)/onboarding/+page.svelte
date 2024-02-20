<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import type { UpdateSchema } from "./+page.server";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";
  import { programmes } from "$lib/utils/programmes";
  import { onMount } from "svelte";

  export let data: PageData;
  const { form, errors, constraints, enhance } = superForm<UpdateSchema>(
    data.form,
    {},
  );
  onMount(() => {
    if (
      data.member &&
      data.member.firstName &&
      data.member.lastName &&
      data.member.classProgramme &&
      data.member.classYear
    ) {
      //goto("/") temporarily commented out for testing
    }
  });
</script>

<svelte:head>
  <title>Onboarding | D-sektionen</title>
</svelte:head>

<div
  class="min-h-screen bg-cover bg-center"
  style="background-image: url('./hero-image.jpg'); "
>
  <div class="min-h-screen bg-cover py-16 md:bg-transparent">
    <div
      class="mx-10 rounded-lg bg-base-200/35 p-10 backdrop-blur-xl md:mx-32 md:max-w-xl"
    >
      <div class="text-5xl font-bold">Welcome</div>
      <div class="text-lg">Fill in your information below</div>

      <form
        id="edit-member"
        method="POST"
        action="?/update"
        use:enhance
        class="form-control gap-2"
      >
        <div class="flex flex-wrap gap-2 [&>*]:min-w-32 [&>*]:flex-1">
          <Input
            name="firstName"
            label="Förnamn"
            required={true}
            bind:value={$form.firstName}
            {...$constraints.firstName}
            error={$errors.firstName}
          />
          <Input
            name="lastName"
            label="Efternamn"
            required={true}
            bind:value={$form.lastName}
            {...$constraints.lastName}
            error={$errors.lastName}
          />
        </div>
        <div class="flex flex-col">
          <Input
            name="pref"
            label="Matpreferens"
            placeholder="Ex. lactos, gluten, mushrooms"
            bind:value={$form.foodPreference}
            {...$constraints.foodPreference}
            error={$errors.foodPreference}
          />
        </div>
        <div class="flex flex-wrap gap-2 [&>*]:min-w-32 [&>*]:flex-1">
          <Labeled
            label="Program"
            id="classProgramme"
            error={$errors.classProgramme}
          >
            <select
              id="classProgramme"
              name="classProgramme"
              class="select select-bordered"
              required={true}
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
              required={true}
              bind:value={$form.classYear}
              {...$constraints.classYear}
            />
          </Labeled>
        </div>
        <div class="flex w-1/2 gap-2 pt-6">
          <button
            name="save"
            type="submit"
            class="btn w-full bg-base-300 text-primary"
          >
            <span class="i-mdi-floppy-disc size-5 bg-primary"></span>
            Spara
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
