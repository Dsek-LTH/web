<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { page } from "$app/stores";
  import FormMarkdown from "$lib/components/forms/FormMarkdown.svelte";
  import LangTabs from "$lib/components/layout/LangTabs.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  export let data;

  const superform = superForm(data.form);
  const { form, errors, constraints, enhance } = superform;
</script>

<div class="p-2 text-neutral-content">
  <form id="info-page-editor" method="POST" action={"?/create"} use:enhance>
    <Input
      name="name"
      label={m.admin_info_name()}
      required
      bind:value={$form.name}
      error={$errors.name}
      {...$constraints.name}
    />

    <LangTabs>
      <FormMarkdown {superform} field="markdown" slot="sv" rows={10} />
      <FormMarkdown {superform} field="markdownEn" slot="en" rows={10} />
    </LangTabs>
    <input type="hidden" name="name" value={$page.params["slug"]} />
    <input type="hidden" name="markdown" bind:value={$form.markdown} />
    {#if $errors.markdown}
      <p class="text-error">{$errors.markdown}</p>
    {/if}

    <button class="btn" type="submit">
      {m.admin_info_create}
    </button>
  </form>
</div>
