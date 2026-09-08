<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance } = superForm(data.createForm, {
    id: "create",
    resetForm: true,
  });

  // svelte-ignore state_referenced_locally
  const { enhance: deleteEnhance } = superForm(data.deleteForm, { id: "delete" });

  let groups = $derived([...data.posToAccessPolicies.entries()]);
</script>

<SetPageTitle title={m.admin_access_positionsPageTitle()} />

<div class="mx-auto max-w-2xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.admin_access_positionsPageTitle()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_access_newPolicy()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form method="POST" action="?/createPolicy" use:enhance class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="position">{m.admin_access_position()}</Label>
          <Input id="position" name="position" bind:value={$form.position} />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="apiName">{m.admin_access_policyCode()}</Label>
          <Input id="apiName" name="apiName" bind:value={$form.apiName} required />
          {#if $errors.apiName}
            <p class="text-destructive text-sm font-medium">{$errors.apiName}</p>
          {/if}
        </div>
        <div class="flex flex-col gap-2">
          <Label for="studentId">{m.admin_access_studentID()}</Label>
          <Input id="studentId" name="studentId" bind:value={$form.studentId} />
        </div>
        <div class="flex justify-end">
          <Button type="submit" class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            {m.admin_access_add()}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <div class="flex flex-col gap-6">
    {#each groups as [role, policies] (role)}
      <Card>
        <CardHeader>
          <CardTitle class="font-mono text-base">{role}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col divide-y">
          {#each policies as policy (policy.id)}
            <div class="flex items-center justify-between gap-4 py-2">
              <span class="font-mono text-sm">{policy.apiName}</span>
              <form method="POST" action="?/deletePolicy" use:deleteEnhance>
                <input type="hidden" name="policyId" value={policy.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={m.delete_delete()}
                >
                  <Trash class="h-4 w-4" />
                </Button>
              </form>
            </div>
          {/each}
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
