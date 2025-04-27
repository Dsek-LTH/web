<script lang="ts">
  import { page } from "$app/stores";
  import FormMarkdown from "$lib/components/forms/FormMarkdown.svelte";
  import LangTabs from "$lib/components/layout/LangTabs.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  let { data } = $props();

  const superform = superForm(data.form);
  const { form, errors, enhance } = superform;
</script>

<SetPageTitle title={$page.params["slug"]} />

<div class="p-2 text-neutral-content">
  {#if data.isCreating}
    <div class="toast">
      <div class="alert alert-info">
        <span>You're creating a new page under {$page.params["slug"]}.</span>
      </div>
    </div>
  {/if}
  <form
    method="POST"
    action={data.isCreating ? "?/create" : "?/update"}
    use:enhance
  >
    <LangTabs>
      {#snippet sv()}
        <FormMarkdown {superform} field="markdown" rows={10} />
      {/snippet}
      {#snippet en()}
        <FormMarkdown {superform} field="markdownEn" rows={10} />
      {/snippet}
    </LangTabs>
    <input type="hidden" name="name" value={$page.params["slug"]} />
    <input type="hidden" name="markdown" bind:value={$form.markdown} />
    {#if $errors.markdown}
      <p class="text-error">{$errors.markdown}</p>
    {/if}
    <button class="btn" type="submit">Submit</button>
  </form>
</div>
