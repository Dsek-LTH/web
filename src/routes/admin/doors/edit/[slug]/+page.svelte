<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";

  export let data;

  let removeModal: HTMLDialogElement | undefined = undefined;
  let selectedPolicy: (typeof data)["doorAccessPolicies"][number] | undefined = undefined;
</script>

<main class="container mx-auto">
  <h1 class="mb-4 text-2xl font-semibold capitalize">{$page.params.slug}</h1>

  <div class="overflow-x-auto">
    <table class="table">
      <!-- head -->
      <thead>
        <tr class="bg-base-200">
          <th>Role/Member</th>
          <th>Start date</th>
          <th>End date</th>
          <th />
        </tr>
      </thead>
      <!-- body -->
      <tbody>
        {#each data.doorAccessPolicies as policy}<tr>
            {#if policy.role}
              <td class="flex items-center gap-3"
                ><span class="i-mdi-account-group h-6 w-6"></span>{policy.role ?? "N/A"}</td
              >
            {:else if policy.member}
              <td class="flex items-center gap-3">
                <div class="avatar">
                  <div class="w-6 rounded-full">
                    {#if policy.member.picturePath}
                      <img src={policy.member.picturePath} alt="Profile avatar" />
                    {:else}
                      <span class="i-mdi-account-circle h-6 w-6"></span>
                    {/if}
                  </div>
                </div>
                <p>{policy.member.firstName} {policy.member.lastName}</p>
              </td>
            {/if}
            <td>{policy.startDatetime?.toLocaleString("sv") ?? "N/A"}</td>
            <td>{policy.endDatetime?.toLocaleString("sv") ?? "N/A"}</td>
            <td class="text-right">
              <button
                on:click={() => {
                  removeModal?.showModal();
                  selectedPolicy = policy;
                }}
                class="btn btn-xs px-8">Remove</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<dialog bind:this={removeModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Revoke door access</h3>
    <p class="py-4">
      Are you sure you want to revoke access to <b class="capitalize">{$page.params.slug}</b> for
      <b>{selectedPolicy?.role || selectedPolicy?.studentId}</b>?
    </p>
    <div class="modal-action">
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={selectedPolicy?.id} /><button
          type="submit"
          class="btn btn-error"
          on:click={() => removeModal?.close()}>Remove</button
        >
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button></button>
  </form>
</dialog>
