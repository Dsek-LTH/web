<script lang="ts">
  import { enhance } from "$app/forms";
  export let data;
  export let form;
  $: uniqueApiNames = data.allPolicies
    .map((policy) => policy.apiName)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
</script>

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
          <td>{apiName}</td>
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
        class="input join-item input-bordered input-primary w-80"
        value={form?.apiName ?? ""}
      />
      <button type="submit" class="btn btn-primary join-item">Add</button>
    </label>
  </form>
  {#if form?.missing}
    <p class="text-red-500">Du måste faktiskt skriva in något</p>
  {/if}
  {#if form?.error}
    <p class="text-red-500">{form.error}</p>
  {/if}
</section>
