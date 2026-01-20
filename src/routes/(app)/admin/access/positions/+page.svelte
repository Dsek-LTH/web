<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";

  let { data } = $props();

  const {
    form: createForm,
    errors: createErrors,
    constraints: createFormConstraints,
    enhance: createFormEnhance,
  } = superForm(data.createForm);

  type PolicyNode = {
    name: string;
    fullPath?: string;
    children: Record<string, PolicyNode>;
  };

  function capitalize(label: string) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

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

  function render(node: PolicyNode, depth = 0): string {
    const indent = depth * 1.25;
    const isLeaf = !!node.fullPath && Object.keys(node.children).length === 0;

    const bgClass = isLeaf
      ? "bg-base-100"
      : depth % 2 === 0
        ? "bg-base-200"
        : "bg-base-200/60";

    if (isLeaf) {
      return `
      <div style="margin-left:${indent}rem" class="border-l border-base-300 pl-3">
        <div
          class="flex items-center justify-between rounded ${bgClass} px-3 py-2"
        >
          <span class="font-semibold">
            ${capitalize(node.name)}
            <span class="ml-2 font-mono font-normal text-sm text-base-content/70">
              : ${node.fullPath}
            </span>
          </span>

          <form method="POST" action="?/deletePolicy" class="ml-2" use:deleteFormEnhance>
            <input type="hidden" name="policyId" value="${node.fullPath}" />
            <button type="submit" aria-label="delete" class="btn btn-xs">
              Delete
            </button>
          </form>
        </div>
      </div>
    `;
    }

    return `
    <div style="margin-left:${indent}rem" class="border-l border-base-300 pl-3">
      <details class="collapse collapse-arrow rounded ${bgClass}">
        <summary class="collapse-title font-semibold">
          ${capitalize(node.name)}
        </summary>

        <div class="collapse-content mt-2 space-y-2">
          ${Object.values(node.children)
            .map((child) => render(child, depth + 1))
            .join("")}
        </div>
      </details>
    </div>
  `;
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
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html render(node)}
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
