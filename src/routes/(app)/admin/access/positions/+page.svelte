<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import PolicyTreeNode from "$lib/components/access/PolicyTreeNode.svelte";
  import type { PolicyNode } from "$lib/components/access/PolicyTreeNode.svelte";

  let { data } = $props();

  const {
    form: createForm,
    errors: createErrors,
    constraints: createFormConstraints,
    enhance: createFormEnhance,
  } = superForm(data.createForm);

  function insertPolicy(root: PolicyNode, policy: string) {
    const parts = policy.split(":");
    let node = root;

    parts.forEach((part, index) => {
      node.children[part] ??= { name: part, children: {} };
      node = node.children[part];

      if (index === parts.length - 1) {
        node.fullPath = policy;
      }
    });
  }

  function buildPolicyTreeForPolicies(
    policies: string[],
  ): Record<string, PolicyNode> {
    const root: PolicyNode = { name: "root", children: {} };
    policies.forEach((p) => insertPolicy(root, p));
    return root.children; // return children instead of the root node
  }

  const posTrees: Array<{
    position: string;
    tree: Record<string, PolicyNode>;
    policies: Array<{ apiName: string; id: string }>;
  }> = Array.from(data.posToAccessPolicies.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([position, policies]) => ({
      position,
      tree: buildPolicyTreeForPolicies(policies.map((p) => p.apiName)),
      policies,
    }));
</script>

<div class="overflow-x-auto">
  <table class="table w-full">
    <thead>
      <tr class="bg-base-200">
        <th colspan="2">
          <a href="." class="link-primary mb-4"> View Per API-Name </a>
        </th>
      </tr>
      <tr class="bg-base-200">
        <th>Role / Position</th>
        <th>Access Policies</th>
      </tr>
    </thead>

    <tbody>
      {#each posTrees as { position, tree, policies }}
        <tr class="odd:bg-gray/10 even:bg-base-200/50">
          <td class="font-medium">{position}</td>
          <td>
            {#if policies.length > 0}
              <details class="collapse collapse-arrow rounded bg-base-200/50">
                <summary class="collapse-title font-semibold">
                  {position} ({policies.length} policies)
                </summary>

                <div class="collapse-content mt-2 space-y-2">
                  {#each Object.values(tree) as node}
                    <PolicyTreeNode
                      {node}
                      showDelete
                      deleteAction="?/deletePolicy"
                    />
                  {/each}

                  <form
                    method="POST"
                    action="?/createPolicy"
                    class="mt-2"
                    use:createFormEnhance
                  >
                    <input type="hidden" name="position" value={position} />
                    <input
                      type="text"
                      name="apiName"
                      placeholder="Policy name"
                      aria-invalid={$createErrors.apiName ? "true" : undefined}
                      class="input input-bordered input-primary w-full max-w-md"
                      bind:value={$createForm.apiName}
                      {...$createFormConstraints.apiName}
                    />
                    <button type="submit" class="btn btn-primary mt-2"
                      >Add Policy</button
                    >
                  </form>
                </div>
              </details>
            {:else}
              <details class="collapse collapse-arrow rounded bg-base-200/50">
                <summary class="collapse-title font-semibold"
                  >{position} (0 policies)</summary
                >
                <div class="collapse-content mt-2 space-y-2">
                  <span class="text-sm text-gray-500">No policies</span>

                  <form
                    method="POST"
                    action="?/createPolicy"
                    class="mt-2"
                    use:createFormEnhance
                  >
                    <input type="hidden" name="position" value={position} />
                    <input
                      type="text"
                      name="apiName"
                      placeholder="Policy name"
                      aria-invalid={$createErrors.apiName ? "true" : undefined}
                      class="input input-bordered input-primary w-full max-w-md"
                      bind:value={$createForm.apiName}
                      {...$createFormConstraints.apiName}
                    />
                    <button type="submit" class="btn btn-primary mt-2"
                      >Add Policy</button
                    >
                  </form>
                </div>
              </details>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
