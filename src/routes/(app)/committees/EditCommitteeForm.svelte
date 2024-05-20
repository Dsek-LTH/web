<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { superForm } from "sveltekit-superforms/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdateSchema } from "./committee.server";
  import { isAuthorized } from "$lib/utils/authorization";
  import { page } from "$app/stores";
  import * as m from "$paraglide/messages";

  let formData: SuperValidated<UpdateSchema>;
  export { formData as form };
  export let open = false;

  const { form, errors, constraints, enhance } = superForm(formData);
</script>

{#if open && isAuthorized(apiNames.COMMITTEE.UPDATE, $page.data.user)}
  <form
    action="?/update"
    method="POST"
    use:enhance
    class="form-control"
    enctype="multipart/form-data"
  >
    <Input
      label={m.committees_name()}
      name="name"
      value={$form.name}
      {...$constraints.name}
    />
    {#if $errors.name}
      <p class="text-error">{$errors.name}</p>
    {/if}
    <Labeled label={m.committees_description()}>
      <textarea
        name="description"
        id="description"
        class="textarea textarea-bordered"
        rows="3"
        value={$form.description}
        {...$constraints.description}
      />
    </Labeled>
    {#if $errors.description}
      <p class="text-error">{$errors.description}</p>
    {/if}
    <Labeled
      label={m.committees_committeeImage()}
      explanation={m.committees_committeeImageExplanation()}
    >
      <input
        name="image"
        id="image"
        class=" file-input file-input-bordered w-full max-w-xs"
        type="file"
        accept=".svg"
        {...$constraints.image}
      />
    </Labeled>
    {#if $errors.image}
      <p class="text-error">{$errors.image}</p>
    {/if}
    <button type="submit" class="btn btn-secondary my-4"
      >{m.committees_save()}</button
    >
  </form>
{/if}
