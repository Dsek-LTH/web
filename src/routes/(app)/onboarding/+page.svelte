<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import type { UpdateSchema } from "./+page.server";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";
  import { programmes } from "$lib/utils/programmes";
  import { onMount } from "svelte";
  import { goto } from "$lib/utils/redirect";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";

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
      data.member.email &&
      data.member.classProgramme &&
      data.member.classYear
    ) {
      goto("/");
    }
  });
</script>

<SetPageTitle title={m.onboarding()} />

<div
  class="min-h-screen bg-cover bg-center"
  style="background-image: url('./hero-image.webp'); "
>
  <div class="min-h-screen bg-cover py-16 md:bg-transparent">
    <div
      class="mx-10 rounded-lg bg-base-200/35 p-10 backdrop-blur-xl md:mx-32 md:max-w-xl"
    >
      <div class="text-5xl font-bold">{m.onboarding_welcome()}</div>
      <div class="text-lg">{m.onboarding_fillInInfoBelow()}</div>

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
            label={m.onboarding_firstName()}
            required={true}
            bind:value={$form.firstName}
            {...$constraints.firstName}
            error={$errors.firstName}
          />
          <Input
            name="lastName"
            label={m.onboarding_lastName()}
            required={true}
            bind:value={$form.lastName}
            {...$constraints.lastName}
            error={$errors.lastName}
          />
        </div>
        <div class="flex flex-col">
          <Input
            name="email"
            label={m.onboarding_email()}
            placeholder={m.onboarding_emailPlaceholder()}
            bind:value={$form.email}
            class="input-disabled"
            readonly
          />
        </div>
        <div class="flex flex-col">
          <Input
            name="pref"
            label={m.onboarding_foodPreference()}
            placeholder={m.onboarding_foodPreferencePlaceholder()}
            bind:value={$form.foodPreference}
            {...$constraints.foodPreference}
            error={$errors.foodPreference}
          />
        </div>
        <div class="flex flex-wrap gap-2 [&>*]:min-w-32 [&>*]:flex-1">
          <Labeled
            label={m.onboarding_programme()}
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
          <Labeled label={m.onboarding_year()} error={$errors.classYear}>
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
            {m.onboarding_save()}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
