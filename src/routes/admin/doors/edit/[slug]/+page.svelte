<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";

  export let data;
  export let form;
  let type: "role" | "member" = "role";

  let removeModal: HTMLDialogElement | undefined = undefined;
  let selectedPolicy: (typeof data)["doorAccessPolicies"][number] | undefined = undefined;
</script>

<main class="container mx-auto px-4">
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

<section class="container mx-auto mt-4 px-4">
  <h2 class="mb-4 text-xl">Grant door access</h2>
  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join join-vertical lg:join-horizontal lg:items-end">
      <select class="join-item select select-bordered w-full lg:max-w-xs" bind:value={type}>
        <option value="role">Role</option>
        <option value="member">Member</option>
      </select>
      <input
        type="text"
        name={type}
        placeholder={type === "role" ? "dsek.infu.dwww" : "ab1234bc-s"}
        class="input join-item input-bordered w-full lg:max-w-xs"
      />
      <div class="form-control join-item w-full lg:max-w-[200px]">
        <label class="label" for="startDatetime">
          <span class="label-text">Start date (optional)</span>
        </label>
        <input
          id="startDatetime"
          name="startDatetime"
          type="datetime-local"
          class="input join-item input-bordered dark:[color-scheme:dark]"
        />
      </div>
      <div class="form-control join-item w-full lg:max-w-[200px]">
        <label class="label" for="endDatetime">
          <span class="label-text">End date (optional)</span>
        </label>
        <input
          id="endDatetime"
          name="endDatetime"
          type="datetime-local"
          class="input join-item input-bordered dark:[color-scheme:dark]"
        />
        <!-- slice gives date formatted as yyyy-MM-ddThh:mm -->
      </div>
      <button type="submit" class="btn btn-primary join-item">Add</button>
    </label>
  </form>
  {#if form?.error}
    <p class="text-error">{form.error}</p>
  {/if}
</section>

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
