<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdateSchema } from "./+page.server";
  import { programmes } from "$lib/utils/programmes";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  export let isEditing;
  export let data: SuperValidated<UpdateSchema>;
  const { form, errors, constraints, enhance } = superForm<UpdateSchema>(data, {
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
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
  <div class="flex w-full flex-wrap gap-2 [&>*:nth-child(3)]:flex-1">
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
    <Input
      name="foodPreference"
      label={m.members_foodPreference()}
      bind:value={$form.foodPreference}
      error={$errors.foodPreference}
      {...$constraints.foodPreference}
    />
  </div>
  <button type="submit" class="btn btn-secondary mt-4"
    >{m.members_save()}</button
  >
</form>
