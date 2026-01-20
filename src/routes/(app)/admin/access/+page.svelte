<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import { writable, derived } from "svelte/store";

  export let data: PageData;

  const { form, errors, constraints, enhance } = superForm(data.form, {
    resetForm: true,
  });

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
      node.children[part] ??= {
        name: part,
        children: {},
      };

      node = node.children[part];

      if (index === parts.length - 1) {
        node.fullPath = policy;
      }
    });
  }

  const search = writable("");

  const filteredPolicies = derived(search, ($search) =>
    (data.accessPolicies ?? [])
      .filter((p): p is string => !!p)
      .filter((policy) => policy.toLowerCase().includes($search.toLowerCase())),
  );

  let policyTree: PolicyNode;

  $: policyTree = (() => {
    const root: PolicyNode = { name: "root", children: {} };

    $filteredPolicies.forEach((policy) => {
      insertPolicy(root, policy);
    });

    return root;
  })();

  function render(node: PolicyNode, depth = 0): string {
    const indent = depth * 1.25;
    const bgClass = depth % 2 === 0 ? "bg-base-200" : "bg-base-200/60";
    const isLeaf = !!node.fullPath && Object.keys(node.children).length === 0;

    // faktisk policy
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

            <a class="btn btn-xs px-4" href="access/${node.fullPath}">
              ${m.admin_access_edit()}
            </a>
          </div>
        </div>
      `;
    }

    // har barn
    return `
      <div style="margin-left:${indent}rem" class="border-l border-base-300 pl-3">
        <details class="collapse collapse-arrow rounded ${bgClass}" ${
          $search ? "open" : ""
        }>
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
</script>

<SetPageTitle title="Access policies" />
<SEO
  data={{
    type: "website",
    props: {
      title: "Access policies",
    },
  }}
/>

<!-- Sök -->
<div class="mb-4 flex items-center gap-2">
  <input
    type="text"
    placeholder="Search policies..."
    class="input input-bordered w-full max-w-md"
    bind:value={$search}
  />

  {#if $search}
    <button class="btn btn-sm" on:click={() => search.set("")}> Clear </button>
  {/if}
</div>

<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr class="bg-base-200">
        <th colspan="2">
          <a href="access/positions" class="link-primary mb-4">
            View Per Position
          </a>
        </th>
      </tr>
    </thead>

    <tbody>
      {#each Object.values(policyTree.children) as node}
        <tr>
          <td>
            {#if !!node.fullPath && Object.keys(node.children).length === 0}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html render(node)}
            {:else}
              <details class="collapse collapse-arrow rounded bg-base-200">
                <summary class="collapse-title font-semibold">
                  {capitalize(node.name)}
                </summary>

                <div class="collapse-content mt-2 space-y-2">
                  {#each Object.values(node.children) as child}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html render(child)}
                  {/each}
                </div>
              </details>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<section class="my-4 space-y-4">
  <h2 class="text-xl font-bold">
    {m.admin_access_addNewPolicy()}
  </h2>

  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join join-vertical md:join-horizontal">
      <span class="label join-item bg-base-200 px-4">
        {m.admin_access_newPolicy()}
      </span>

      <input
        type="text"
        name="apiName"
        placeholder="Policy name"
        aria-invalid={$errors.apiName ? "true" : undefined}
        class="input join-item input-bordered input-primary md:flex-1"
        bind:value={$form.apiName}
        {...$constraints.apiName}
      />

      {#if $errors.apiName}
        <span class="text-error">{$errors.apiName}</span>
      {/if}

      <button type="submit" class="btn btn-primary join-item">
        {m.admin_access_add()}
      </button>
    </label>
  </form>
</section>
