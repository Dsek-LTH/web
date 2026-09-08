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
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance } = superForm(data.form);
</script>

<SetPageTitle title={m.admin_access_pageTitle()} />

<div class="mx-auto max-w-2xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.admin_access_pageTitle()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_access_addNewPolicy()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form method="POST" action="?/create" use:enhance class="flex items-end gap-2">
        <div class="flex flex-1 flex-col gap-2">
          <Label for="apiName">{m.admin_access_policyCode()}</Label>
          <Input id="apiName" name="apiName" bind:value={$form.apiName} required />
          {#if $errors.apiName}
            <p class="text-destructive text-sm font-medium">{$errors.apiName}</p>
          {/if}
        </div>
        <Button type="submit" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          {m.admin_access_add()}
        </Button>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>{m.admin_access_knownPolicies()}</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col divide-y">
      {#each data.accessPolicies as apiName (apiName)}
        <a
          href="/admin/access/{apiName}"
          class="flex items-center justify-between py-3 hover:underline"
        >
          <span class="font-mono text-sm">{apiName}</span>
          <ChevronRight class="text-muted-foreground h-4 w-4" />
        </a>
      {/each}
    </CardContent>
  </Card>
</div>
