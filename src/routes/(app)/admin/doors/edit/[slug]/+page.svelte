<script lang="ts">
  import { page } from "$app/stores";
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
  let type: "role" | "studentId" = "role";

  let removeModal: HTMLDialogElement | undefined = undefined;
  let informationModal: HTMLDialogElement | undefined = undefined;
  let selectedPolicy: (typeof data)["doorAccessPolicies"][number] | undefined =
    undefined;
  const { form, errors, constraints, enhance } = superForm(data.createForm);
</script>

<main class="container mx-auto px-4">
  <h1 class="mb-4 text-2xl font-semibold capitalize">{$page.params["slug"]}</h1>
  <div class="overflow-x-auto rounded-lg">
    <table class="table">
      <thead class="bg-base-200">
        <tr>
          <th>{m.admin_doors_roleMember()}</th>
          <th>{m.admin_doors_startDate()}</th>
          <th>{m.admin_doors_endDate()}</th>
          <th></th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {#each data.doorAccessPolicies as policy}<tr
            class:bg-red-400={policy.isBan}
            class:text-black={policy.isBan}
          >
            {#if policy.role}
              <td class="flex items-center gap-3"
                ><span class="i-mdi-account-group h-6 w-6"
                ></span>{policy.role ?? "N/A"}</td
              >
            {:else if policy.member}
              <td class="flex items-center gap-3">
                <div class="avatar">
                  <div class="w-6 rounded-full">
                    {#if policy.member.picturePath}
                      <img
                        src={policy.member.picturePath}
                        alt="Profile avatar"
                      />
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
            {#if policy.information}
              <td class="policy-information">
                <button
                  on:click={() => {
                    informationModal?.showModal();
                    selectedPolicy = policy;
                  }}
                  class="btn-error rounded-full fill-base-content"
                  ><span class="i-mdi-information h-7 w-7 bg-base-content"
                  ></span></button
                >
                <dialog id="my_modal_1" class="modal">
                  <div class="modal-box">
                    <h3 class="text-lg font-bold">Information!</h3>
                    <p class="py-4">{policy.information}</p>
                    <div class="modal-action">
                      <form method="dialog">
                        <!-- if there is a button in form, it will close the modal -->
                        <button class="btn">Close</button>
                      </form>
                    </div>
                  </div>
                </dialog>
              </td>
            {:else}
              <div></div>
            {/if}
            <td class="text-right">
              <button
                on:click={() => {
                  removeModal?.showModal();
                  selectedPolicy = policy;
                }}
                class="btn btn-xs px-8">{m.admin_doors_remove()}</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<section class="container mx-auto mt-4 px-4">
  <h2 class="mb-4 text-xl">{m.admin_doors_grantDoorAccess()}</h2>
  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join join-vertical lg:join-horizontal lg:items-end">
      <select
        class="join-item select select-bordered w-full lg:max-w-xs"
        bind:value={type}
      >
        <option value="role">{m.admin_doors_role()}</option>
        <option value="studentId">{m.admin_doors_member()}</option>
      </select>
      <input
        type="text"
        name={type}
        placeholder={type === "role" ? "dsek.infu.dwww" : "ab1234bc-s"}
        class="input join-item input-bordered w-full lg:max-w-xs"
        bind:value={$form[type]}
        {...$constraints[type]}
      />
      <div class="form-control join-item w-full lg:max-w-[200px]">
        <Labeled label={m.admin_doors_startDateOptional()}>
          <input
            id="startDatetime"
            name="startDatetime"
            type="datetime-local"
            class="input join-item input-bordered"
            bind:value={$form.startDatetime}
            {...$constraints.startDatetime}
          />
        </Labeled>
      </div>
      <div class="form-control join-item w-full lg:max-w-[200px]">
        <Labeled label={m.admin_doors_endDateOptional()}>
          <input
            id="endDatetime"
            name="endDatetime"
            type="datetime-local"
            class="input join-item input-bordered"
            bind:value={$form.endDatetime}
            {...$constraints.endDatetime}
          />
        </Labeled>
      </div>
      <div
        class="flex w-full items-center justify-center py-2 transition-colors lg:max-w-[200px]"
        class:bg-red-400={$form.isBan}
      >
        <p class="p-1" id="banText" class:text-black={$form.isBan}>Ban</p>
        <input
          id="isBan"
          name="isBan"
          type="checkbox"
          class="toggle"
          bind:checked={$form.isBan}
        />
        <span class="slider round"></span>
      </div>
      <div class="form-control w-full">
        <input
          id="information"
          name="information"
          type="text"
          class="input join-item input-bordered"
          placeholder="Additional information"
          bind:value={$form.information}
        />
      </div>
      <label class="switch join-item">
        <div class="flex-auto">
          <button type="submit" class="btn btn-primary join-item"
            >{m.admin_doors_add()}</button
          >
        </div>
      </label>
    </label>
    {#if Object.keys($errors).length > 0}
      <div class="text-error">
        <ul class="list-inside list-disc">
          {#each Object.values($errors) as error}<li>{error}</li>{/each}
        </ul>
      </div>
    {/if}
  </form>
</section>

<dialog bind:this={removeModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <h3 class="text-lg font-bold">{m.admin_doors_revokeDoorAccess()}</h3>
    <p class="py-4">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.admin_doors_revokeAreYouSure({
        door: `${$page.params["slug"]}`,
        target: `${selectedPolicy?.role || selectedPolicy?.studentId}`,
      })}
    </p>
    <div class="modal-action">
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={selectedPolicy?.id} />
        <button
          type="submit"
          class="btn btn-error"
          on:click={() => removeModal?.close()}
        >
          {m.admin_doors_remove()}
        </button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button class="cursor-auto"></button>
  </form>
</dialog>

<dialog bind:this={informationModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <div class="flex items-center">
      <span class="i-mdi-information h-6 w-6"></span>
      <h3 class="px-1 text-lg font-bold">
        <b class="capitalize">{$page.params["slug"]}</b>
        <b>{selectedPolicy?.member || selectedPolicy?.role}</b>
      </h3>
    </div>
    <p class="py-4">
      <b class="normal-case">{selectedPolicy?.information}</b>
    </p>
    <button
      type="submit"
      class="btn btn-error"
      on:click={() => informationModal?.close()}
    >
      Close
    </button>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button class="cursor-auto"></button>
  </form>
</dialog>
