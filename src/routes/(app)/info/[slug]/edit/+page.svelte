<script lang="ts">
  import { page } from "$app/stores";
  import type { PageData } from "./$types";
  export let data: PageData;
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import { superForm } from "sveltekit-superforms";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  const { form, errors, enhance } = superForm(data.form);
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
    <MarkdownEditor bind:value={$form.markdown} />
    <input type="hidden" name="name" value={$page.params["slug"]} />
    <input type="hidden" name="markdown" bind:value={$form.markdown} />
    {#if $errors.markdown}
      <p class="text-error">{$errors.markdown}</p>
    {/if}
    <button class="btn" type="submit">Submit</button>
  </form>
</div>
