<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  export let data: PageData;
  const { form, errors, constraints, enhance } = superForm(data.form, {
    resetForm: true,
  });
  const groupedPolicies: Record<string, string[]> = (data.accessPolicies ?? [])
    .filter((p): p is string => !!p) // ensure no undefined
    .reduce(
      (acc, policy) => {
        const prefix = policy.includes(":") ? policy.split(":", 1)[0]! : policy;
        acc[prefix] ??= [];
        acc[prefix].push(policy);
        return acc;
      },
      {} as Record<string, string[]>,
    );
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

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th colspan="2">
          <a href="access/positions" class="link-primary mb-4"
            >View Per Position</a
          >
        </th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries(groupedPolicies) as [prefix, policies]}
        <tr>
          <td>
            <details class="collapse collapse-arrow rounded bg-base-200">
              <summary class="collapse-title font-semibold">
                {prefix} ({policies.length})
              </summary>
              <div class="collapse-content mt-2 space-y-2">
                {#each policies as policy}
                  <div
                    class="flex items-center justify-between rounded bg-base-100 px-2 py-1"
                  >
                    <span class="font-mono">{policy}</span>
                    <a class="btn btn-xs px-4" href="access/{policy}">
                      {m.admin_access_edit()}
                    </a>
                  </div>
                {/each}
              </div>
            </details>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<section class="my-4 space-y-4">
  <h2 class="text-xl font-bold">{m.admin_access_addNewPolicy()}</h2>
  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join join-vertical md:join-horizontal">
      <span class="label join-item bg-base-200 px-4"
        >{m.admin_access_newPolicy()}</span
      >
      <input
        type="text"
        name="apiName"
        placeholder="Policy name"
        aria-invalid={$errors.apiName ? "true" : undefined}
        class="input join-item input-bordered input-primary md:flex-1"
        bind:value={$form.apiName}
        {...$constraints.apiName}
      />
      {#if $errors.apiName}<span class="text-error">{$errors.apiName}</span
        >{/if}

      <button type="submit" class="btn btn-primary join-item"
        >{m.admin_access_add()}
      </button>
    </label>
  </form>
</section>
