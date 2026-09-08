<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Search from "@lucide/svelte/icons/search";
  import Trash from "@lucide/svelte/icons/trash";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { enhance: deleteEnhance } = superForm(data.deleteForm, { id: "delete" });

  let search = $state("");

  let groups = $derived.by(() => {
    const all = [...data.posToAccessPolicies.entries()];
    const filtered = search.trim()
      ? all.filter(([role]) =>
          role.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : all;
    return filtered.sort(([a], [b]) => a.localeCompare(b));
  });
</script>

<SetPageTitle title={m.admin_access_positionsPageTitle()} />

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <Button
    variant="ghost"
    href="/admin/access"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <h1 class="mb-2 text-3xl font-bold">{m.admin_access_positionsPageTitle()}</h1>
  <p class="text-muted-foreground mb-6">
    {m.admin_access_positionsPageDesc()}
  </p>

  <div class="relative mb-6">
    <Search
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
    />
    <Input
      bind:value={search}
      placeholder={m.admin_access_role()}
      class="pl-9"
    />
  </div>

  {#if groups.length === 0}
    <p class="text-muted-foreground">{m.admin_access_noMatches()}</p>
  {:else}
    <div class="flex flex-col gap-6">
      {#each groups as [role, policies] (role)}
        <Card>
          <CardHeader>
            <CardTitle class="font-mono text-base">{role}</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col divide-y">
            {#each policies as policy (policy.id)}
              <div class="flex items-center justify-between gap-4 py-2">
                <a
                  href="/admin/access/{policy.apiName}"
                  class="font-mono text-sm hover:underline"
                >
                  {policy.apiName}
                </a>
                <AlertDialog.Root>
                  <AlertDialog.Trigger
                    class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    aria-label={m.delete_delete()}
                  >
                    <Trash class="h-4 w-4" />
                  </AlertDialog.Trigger>
                  <AlertDialog.Content>
                    <AlertDialog.Header>
                      <AlertDialog.Title>
                        {m.admin_confirmDelete_title({ item: policy.apiName })}
                      </AlertDialog.Title>
                      <AlertDialog.Description>
                        {m.admin_confirmDelete_description()}
                      </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                      <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
                      <form method="POST" action="?/deletePolicy" use:deleteEnhance>
                        <input type="hidden" name="policyId" value={policy.id} />
                        <AlertDialog.Action
                          type="submit"
                          class={buttonVariants({ variant: "destructive" })}
                        >
                          {m.delete_delete()}
                        </AlertDialog.Action>
                      </form>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </div>
            {/each}
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
