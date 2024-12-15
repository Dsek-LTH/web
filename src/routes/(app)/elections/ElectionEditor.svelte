<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { ElectionSchema } from "./schemas";
  import * as m from "$paraglide/messages";

  export let isCreating: boolean;
  export let data: {
    form: SuperValidated<ElectionSchema>;
    committees: Array<{ id: string; name: string; nameEn: string | null }>;
    election: {
      markdown: string;
      markdownEn: string | null;
      link: string;
      expiresAt: Date;
      committeeId: string;
    };
  };
  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<form
  id="election-editor"
  method="POST"
  action={isCreating ? "?/create" : "?/update"}
  use:enhance
  class="flex flex-col gap-3"
>
  <h1 class="text-2xl font-bold">
    {isCreating ? m.elections_create() : m.elections_edit()}
  </h1>
  <Input
    name="markdown"
    label={m.elections_content_sv()}
    required
    textarea
    bind:value={$form.markdown}
    error={$errors.markdown}
    {...$constraints.markdown}
  />
  <Input
    name="markdownEn"
    label={m.elections_content_en()}
    required
    textarea
    bind:value={$form.markdownEn}
    error={$errors.markdownEn}
    {...$constraints.markdownEn}
  />
  <Input
    name="link"
    label={m.elections_link()}
    required
    bind:value={$form.link}
    error={$errors.link}
    {...$constraints.link}
  />
  <Input
    name="expiresAt"
    label={m.elections_expiryDate()}
    type="date"
    required
    bind:value={$form.expiresAt}
    error={$errors.expiresAt}
    {...$constraints.expiresAt}
  />

  <label class="label-text" for="committee">{m.elections_committee()}*</label>
  <select
    id="committee"
    name="committeeId"
    class="max-w select select-bordered w-full"
    bind:value={$form.committeeId}
    {...$constraints.committeeId}
  >
    {#each data.committees as committeeOption}
      <option value={committeeOption.id}>{committeeOption.name}</option>
    {/each}
  </select>
  {#if $errors.committeeId}
    <p class="text-error">{$errors.committeeId}</p>
  {/if}
  <button type="submit" class="btn btn-primary mx-auto mt-4 w-4/12">
    {m.elections_save()}
  </button>
</form>
