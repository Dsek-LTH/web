<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";

  let { data } = $props();

  const {
    form: createForm,
    errors: createErrors,
    constraints: createFormConstraints,
    enhance: createFormEnhance,
  } = superForm(data.createForm);
  const { enhance: deleteFormEnhance } = superForm(data.deleteForm);
</script>

<a href="." class="link-primary mb-4">View per apiname</a>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Position</th>
        <th>Number of policies</th>
      </tr>
    </thead>
    <tbody class="">
      {#each Array.from(data.posToAccessPolicies.entries()).sort( (a, b) => (a[0] < b[0] ? -1 : 1), ) as pos}
        <tr class="odd:bg-gray even:bg-base-200">
          <td class="font-medium">{pos[0]}</td>
          <td class="text-right">
            <div class="collapse collapse-arrow">
              <input type="checkbox" class="w-full" />
              <div class="collapse-title w-full">
                {pos[1].length} access accessPolicies
              </div>

              <div class="collapse-content grid grid-cols-2">
                {#each pos[1] as policy}
                  <form
                    method="POST"
                    action="?/deletePolicy"
                    class="col-span-1"
                    use:deleteFormEnhance
                  >
                    <input
                      type="text"
                      name="policyId"
                      hidden
                      value={policy.id}
                    />
                    {policy.apiName}
                    <button type="submit" aria-label="delete" class="ml-3">
                      <span
                        class="i-mdi-trash-can bg-primary hover:bg-primary/70"
                      ></span>
                    </button>
                  </form>
                {/each}
                <div class="col-span-2 pt-4">
                  <form
                    method="POST"
                    action="?/createPolicy"
                    use:createFormEnhance
                  >
                    <input type="hidden" value={pos[0]} name="position" />
                    <input
                      type="text"
                      name="apiName"
                      placeholder="Policy name"
                      aria-invalid={$createErrors.apiName ? "true" : undefined}
                      class="input join-item input-bordered input-primary md:flex-1"
                      bind:value={$createForm.apiName}
                      {...$createFormConstraints.apiName}
                    />
                    <button type="submit" class="btn btn-primary">add</button>
                  </form>
                </div>
              </div>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
