<script lang="ts">
  import { superForm } from "sveltekit-superforms/client";
  export let data;
  const { form, errors, constraints, enhance, message } = superForm(data.form, {
    onError(event) {
      message.set(event.result.error.message);
    },
    resetForm: true,
  });
  $: uniqueApiNames = data.allPolicies
    .map((policy) => policy.apiName)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
</script>

<svelte:head>
  <title>Access policies | D-sektionen</title>
</svelte:head>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Policy code</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each uniqueApiNames as apiName}
        <tr>
          <td class="font-medium">{apiName}</td>
          <td class="text-right"><a class="btn btn-xs px-8" href="access/{apiName}">Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<section class="flex flex-col gap-4 py-4">
  <h2 class="text-xl font-bold">Add new policies</h2>
  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join">
      <span class="label join-item bg-base-200 px-4">New policy</span>
      <input
        type="text"
        name="apiName"
        placeholder="Policy name"
        aria-invalid={$errors.apiName ? "true" : undefined}
        class="input join-item input-bordered input-primary w-80"
        bind:value={$form.apiName}
        {...$constraints.apiName}
      />
      {#if $errors.apiName}<span class="text-error">{$errors.apiName}</span>{/if}

      <button type="submit" class="btn btn-primary join-item">Add</button>
    </label>
    {#if $message}
      <div class="text-error">{$message}</div>
    {/if}
  </form>
</section>
