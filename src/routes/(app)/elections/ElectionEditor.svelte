<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { ElectionSchema } from "./schemas";
  import * as m from "$paraglide/messages";
  import type { Election } from "@prisma/client";

  export let isCreating: boolean;
  export let data: {
    form: SuperValidated<ElectionSchema>;
    committees: Array<{ id: string; name: string; nameEn: string | null }>;
    election: Pick<
      Election,
      "markdown" | "markdownEn" | "link" | "expiresAt" | "committeeId"
    >;
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
  <div class="flex flex-col gap-0 *:w-full md:h-64 md:flex-row md:gap-8">
    <Input
      name="markdown"
      label={m.elections_content_sv()}
      textarea
      bind:value={$form.markdown}
      error={$errors.markdown}
      class="h-full"
      placeholder="- Post 1&#13;- Post 2&#13;- Post 3"
      {...$constraints.markdown}
    />
    <Input
      name="markdownEn"
      label={m.elections_content_en()}
      textarea
      bind:value={$form.markdownEn}
      error={$errors.markdownEn}
      class="h-full"
      placeholder="- Position 1&#13;- Position 2&#13;- Position 3"
      {...$constraints.markdownEn}
    />
  </div>
  <Input
    name="link"
    label={m.elections_link()}
    bind:value={$form.link}
    error={$errors.link}
    placeholder={m.elections_link_placeholder()}
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
  <button type="submit" class="btn btn-primary mx-auto mt-4 w-4/12">
    {m.elections_save()}
  </button>
</form>
