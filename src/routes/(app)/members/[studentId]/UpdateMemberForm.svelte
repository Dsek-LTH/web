<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdateSchema } from "./+page.server";
  import { programmes } from "$lib/utils/programmes";
  import { languages } from "$lib/utils/languages";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { page } from "$app/state";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  interface PageProps {
    isEditing: boolean;
    phadderGroups: Array<ExtendedPrismaModel<"PhadderGroup">>;
    data: SuperValidated<UpdateSchema>;
  }

  let { isEditing = $bindable(), phadderGroups, data }: PageProps = $props();

  const superform = superForm<UpdateSchema>(data, {
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
  const { form, errors, constraints, enhance } = superform;
  let isEditingGraduationYear = $derived($form.graduationYear != null);
</script>

<form
  id="edit-member"
  method="POST"
  action="?/update"
  use:enhance
  class="form-control max-w-full gap-2"
>
  <div class="flex flex-wrap gap-2 [&>*]:flex-1">
    <Input
      name="firstName"
      label={m.members_firstName()}
      bind:value={$form.firstName}
      {...$constraints.firstName}
      error={$errors.firstName}
    />
    <Input
      name="nickname"
      explanation={m.members_nickname_explanation()}
      label={m.members_nickname()}
      bind:value={$form.nickname}
      {...$constraints.nickname}
      error={$errors.nickname}
    />
    <Input
      name="lastName"
      label={m.members_lastName()}
      bind:value={$form.lastName}
      {...$constraints.lastName}
      error={$errors.lastName}
    />
  </div>
  <Input
    name="foodPreference"
    label={m.members_foodPreference()}
    bind:value={$form.foodPreference}
    error={$errors.foodPreference}
    {...$constraints.foodPreference}
  />
  <Labeled
    label={m.members_language()}
    error={$errors.language}
    fullWidth
  >
    <select
      id="language"
      name="language"
      class="select select-bordered"
      bind:value={$form.language}
      {...$constraints.language}
    >
      {#each languages as language (language.id)}
        <option value={language.id}>{language.name}</option>
      {/each}
    </select>
  </Labeled>
  <div
    class="flex w-full flex-wrap gap-2 *:flex-1"
    class:hidden={!isAuthorized(apiNames.MEMBER.UPDATE, page.data.user)}
  >
    <Labeled
      label={m.members_programme()}
      error={$errors.classProgramme}
      fullWidth
    >
      <select
        id="classProgramme"
        name="classProgramme"
        class="select select-bordered"
        bind:value={$form.classProgramme}
        {...$constraints.classProgramme}
      >
        {#each programmes as programme (programme.id)}
          <option value={programme.id}>{programme.name}</option>
        {/each}
      </select>
    </Labeled>
    <Labeled label={m.members_year()} error={$errors.classYear} fullWidth>
      <input
        type="number"
        name="classYear"
        id="classYear"
        class="input input-bordered"
        bind:value={$form.classYear}
        {...$constraints.classYear}
      />
    </Labeled>
    <FormSelect
      {superform}
      label={m.onboarding_phadderGroup()}
      field="nollningGroupId"
      options={[
        {
          value: null,
          label: "-",
        },
        ...phadderGroups
          .filter(
            (group) =>
              group.year === ($form.classYear ?? new Date().getFullYear),
          )
          .map((group) => ({
            value: group.id,
            label: group.name,
          })),
      ]}
    />
    <div>
      <Labeled label={m.members_hasGraduated()}>
        <input
          type="checkbox"
          class="checkbox-primary checkbox"
          bind:checked={isEditingGraduationYear}
          {...$constraints.graduationYear}
        />
      </Labeled>
      {#if isEditingGraduationYear}
        <Labeled
          label={m.members_graduationYear()}
          error={$errors.graduationYear}
        >
          <input
            type="number"
            name="graduationYear"
            id="graduationYear"
            class="input input-bordered"
            bind:value={$form.graduationYear}
            {...$constraints.graduationYear}
          />
        </Labeled>
      {/if}
    </div>
  </div>
  <div class="mt-4 flex flex-wrap gap-2 *:flex-1">
    <a href="{page.params['studentId']}/edit-bio" class="btn">
      {m.members_editBio()}
    </a>
    <button type="submit" class="btn btn-primary">{m.members_save()}</button>
  </div>
</form>
