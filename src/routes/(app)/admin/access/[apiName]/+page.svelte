<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import RoleSelector from "$lib/components/RoleSelector.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import { page } from "$app/state";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import type { RoleOption } from "$lib/components/RoleSelector.svelte";

  let { data } = $props();
  let apiName = $derived(page.params.apiName ?? "");

  // svelte-ignore state_referenced_locally
  const { errors, enhance } = superForm(data.createForm, {
    id: "create",
    onUpdated: ({ form }) => {
      if (form.valid) {
        selectedMembers = [];
        selectedRoles = [];
      }
    },
  });

  let subjectType = $state<"member" | "role">("member");
  let selectedMembers = $state<Array<MemberSearchReturnAttributes & { id?: string }>>(
    [],
  );
  let selectedRoles = $state<RoleOption[]>([]);

  // svelte-ignore state_referenced_locally
  const { enhance: deleteEnhance } = superForm(data.deleteForm, {
    id: "delete",
  });
</script>

<SetPageTitle title={apiName} />

<div class="mx-auto max-w-4xl px-4 py-8">
  <Button variant="ghost" href="/admin/access" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <h1 class="mb-6 font-mono text-2xl font-bold break-all">{apiName}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_access_newPolicy()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/create"
        use:enhance
        class="flex flex-col gap-4"
      >
        <ButtonGroup.Root>
          <Button
            type="button"
            variant={subjectType === "member" ? "rosa" : "outline"}
            onclick={() => (subjectType = "member")}
          >
            {m.admin_doors_member()}
          </Button>
          <Button
            type="button"
            variant={subjectType === "role" ? "rosa" : "outline"}
            onclick={() => (subjectType = "role")}
          >
            {m.admin_doors_role()}
          </Button>
        </ButtonGroup.Root>

        <input type="hidden" name="type" value={subjectType} />
        {#if subjectType === "member"}
          <MemberSelector
            multiple
            showId
            showClass
            name="subjects"
            bind:selectedMembers
          />
        {:else}
          <RoleSelector multiple name="subjects" bind:selectedRoles />
        {/if}

        {#if $errors._errors}
          <p class="text-destructive text-sm font-medium">
            {$errors._errors.join(", ")}
          </p>
        {/if}
        <div class="flex justify-end">
          <Button type="submit" class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            {m.admin_access_add()}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardContent class="flex flex-col divide-y">
      {#each data.policies as policy (policy.id)}
        <div class="flex items-center justify-between gap-4 py-3">
          <div>
            {#if policy.role}
              <p class="font-medium">{m.admin_access_role()}: {policy.role}</p>
            {/if}
            {#if policy.member}
              <p class="font-medium">
                {policy.member.firstName} {policy.member.lastName} ({policy.studentId})
              </p>
            {:else if policy.studentId}
              <p class="font-medium">{policy.studentId}</p>
            {/if}
          </div>
          <form method="POST" action="?/delete" use:deleteEnhance>
            <input type="hidden" name="id" value={policy.id} />
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
      {:else}
        <p class="text-muted-foreground py-3">{m.admin_access_noEntries()}</p>
      {/each}
    </CardContent>
  </Card>
</div>
