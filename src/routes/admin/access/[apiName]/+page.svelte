<script lang="ts">
  import DeletePolicyForm from "./DeletePolicyForm.svelte";

  import { page } from "$app/stores";
  import { superForm } from "sveltekit-superforms/client";

  export let data;
  const {
    form: createForm,
    errors,
    constraints,
    enhance,
  } = superForm(data.createForm, {
    resetForm: true,
  });
  $: policies = data.policies.sort((a, b) => {
    if (a.role && b.role) return a.role.localeCompare(b.role, "sv");
    if (a.role && !b.role) return -1;
    if (!a.role && b.role) return 1;
    return a.studentId!.localeCompare(b.studentId!, "sv");
  });
</script>

<svelte:head>
  <title>{$page.params.apiName} | D-sektionen</title>
</svelte:head>

<h1 class="mb-4 text-4xl font-semibold">{$page.params.apiName}</h1>
<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Role</th>
        <th>Member</th>
        <th>Created At</th>
        <th />
      </tr>
    </thead>
    <!-- body -->
    <tbody>
      {#each policies as policy}<tr>
          <td>{policy.role ?? ""}</td>
          <td>{policy.studentId ? `${policy.member?.firstName} ${policy.member?.lastName}` : ""}</td
          >
          <td>{policy.createdAt?.toLocaleString("sv")}</td>
          <td class="text-right">
            <DeletePolicyForm data={data.deleteForm} policyId={policy.id} />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <section class="flex flex-col gap-4 py-4">
    <h2 class="text-xl font-bold">Add new policies</h2>
    <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
      <label class="join">
        <span class="label join-item bg-base-200 px-4">Role</span>
        <input
          type="text"
          name="role"
          placeholder="Type here"
          class="input join-item input-bordered input-primary w-80"
          bind:value={$createForm.role}
          {...$constraints.role}
        />
        <button type="submit" class="btn btn-primary join-item">Add</button>
      </label>
      {#if $errors.role}
        <span class="text-error">{$errors.role}</span>
      {/if}
      <label class="join">
        <span class="label join-item bg-base-200 px-4">Student ID</span>
        <input
          type="text"
          name="studentId"
          placeholder="Type here"
          class="input join-item input-bordered input-primary w-80"
          bind:value={$createForm.studentId}
          {...$constraints.studentId}
        />
        <button type="submit" class="btn btn-primary join-item">Add</button>
      </label>
      {#if $errors.studentId}<span class="text-error">{$errors.studentId}</span>{/if}
    </form>
  </section>
</div>
