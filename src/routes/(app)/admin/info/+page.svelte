<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import FormMarkdown from "$lib/components/forms/FormMarkdown.svelte";
  import LangTabs from "$lib/components/layout/LangTabs.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { slugify } from "$lib/utils/slugify";
  import * as m from "$paraglide/messages";
  let { data } = $props();

  const superform = superForm(data.form);
  const { form, errors, constraints, enhance } = superform;
</script>

<div class="p-2 text-neutral-content">
  <form
    id="info-page-editor"
    method="POST"
    action="?/create"
    class="space-y-8"
    use:enhance
  >
    <Input
      name="name"
      label={m.admin_info_name()}
      required
      bind:value={$form.name}
      error={$errors.name}
      {...$constraints.name}
    />

    <LangTabs>
      {#snippet sv()}
        <FormMarkdown {superform} field="markdown" rows={10} />
      {/snippet}
      {#snippet en()}
        <FormMarkdown {superform} field="markdownEn" rows={10} />
      {/snippet}
    </LangTabs>
    <input type="hidden" name="markdown" bind:value={$form.markdown} />
    {#if $errors.markdown}
      <p class="text-error">{$errors.markdown}</p>
    {/if}

    {#if $form.name}
      <pre
        class="input input-bordered input-disabled flex items-center">dsek.se/info/{slugify(
          $form.name,
        )}</pre>
    {/if}

    <button class="btn" type="submit">
      {m.admin_info_create()}
    </button>
  </form>
</div>
