<script lang="ts">
  import type { PageProps } from "./$types";
  import { page } from "$app/state";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import { superForm } from "$lib/utils/client/superForms";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import { getFullName } from "$lib/utils/client/member";
  import { Badge } from "$lib/components/ui/badge";

  let { data }: PageProps = $props();
  let policies = $derived(data.doorAccessPolicies);
  const { form, errors, constraints, enhance } = superForm(data.createForm);

  const types = [
    { value: "member", label: "Member" },
    { value: "role", label: "Role" },
  ] as const;
  let typeTrigger = $derived.by(() => {
    const found = types.find((t) => t.value === $form.type);
    return found ? found.label : "Choose type";
  });

  const modes = [
    { value: "allow", label: "Allow" },
    { value: "deny", label: "Deny" },
  ] as const;
  let modeTrigger = $derived.by(() => {
    const found = modes.find((m) => m.value === $form.mode);
    return found ? found.label : "Choose mode";
  });
</script>

<div class="space-y-6">
  <!-- Form -->
  <Card>
    <CardHeader>
      <CardTitle>Add Access Rule</CardTitle>
      <CardDescription>
        Grant or restrict access to {page.params["slug"]}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" method="POST" action="?/create" use:enhance>
        <!-- TODO: display toast on success and form errors on failure -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="space-y-2 sm:col-span-2">
            <Label for="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="e.g., John Doe or dsek.cpu"
              aria-invalid={$errors.subject ? "true" : undefined}
              bind:value={$form.subject}
              {...$constraints.subject}
            />
          </div>

          <div class="space-y-2">
            <Label for="type">Type</Label>
            <Select
              type="single"
              name="type"
              bind:value={$form.type}
              {...$constraints.type}
            >
              <SelectTrigger id="type" class="w-full">
                {typeTrigger}
              </SelectTrigger>
              <SelectContent>
                {#each types as t (t.value)}
                  <SelectItem value={t.value} label={t.label}>
                    {t.label}
                  </SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="mode">Mode</Label>
            <Select
              type="single"
              name="mode"
              bind:value={$form.mode}
              {...$constraints.mode}
            >
              <SelectTrigger id="mode" class="w-full">
                {modeTrigger}
              </SelectTrigger>
              <SelectContent>
                {#each modes as m (m.value)}
                  <SelectItem value={m.value} label={m.label}>
                    {m.label}
                  </SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="start-date">Start Date (Optional)</Label>
            <Input
              id="start-date"
              type="date"
              name="startDatetime"
              aria-invalid={$errors.startDatetime ? "true" : undefined}
              bind:value={$form.startDatetime}
              {...$constraints.startDatetime}
            />
          </div>

          <div class="space-y-2">
            <Label for="end-date">End Date (Optional)</Label>
            <Input
              id="end-date"
              type="date"
              name="endDatetime"
              aria-invalid={$errors.endDatetime ? "true" : undefined}
              bind:value={$form.endDatetime}
              {...$constraints.endDatetime}
            />
          </div>
        </div>

        <div class="space-y-2 sm:col-span-2">
          <Label for="entity-name">Reason (Optional)</Label>
          <Input
            id="entity-name"
            placeholder="Why is this rule added?"
            name="reason"
            aria-invalid={$errors.reason ? "true" : undefined}
            bind:value={$form.reason}
            {...$constraints.reason}
          />
        </div>

        <Button type="submit" class="w-full">Add Rule</Button>
      </form>
    </CardContent>
  </Card>

  <!-- Access policy list -->
  <Card>
    <CardHeader>
      <CardTitle>Current Rules</CardTitle>
      <CardDescription>
        {#if policies.length === 0}
          No access policies configured yet
        {:else}
          {policies.length} rule{policies.length !== 1 ? "s" : ""} configured
        {/if}
      </CardDescription>
    </CardHeader>
    {#if policies.length > 0}
      <CardContent>
        <ul class="m-0 space-y-3">
          {#each policies as policy (policy.id)}
            {@const type = policy.studentId === null ? "role" : "member"}
            <li class="flex items-center justify-between rounded-md border p-4">
              <div>
                <div class="flex items-center gap-2">
                  <p class="mt-0 font-medium">
                    {#if type === "member"}
                      {getFullName(policy.member!, { hideNickname: true })}
                    {:else}
                      {policy.role}
                    {/if}
                  </p>
                  <Badge variant="outline">
                    {#if type === "member"}
                      Member
                    {:else}
                      Role
                    {/if}
                  </Badge>
                  {#if policy.isBan}
                    <Badge variant="rosa">Banned</Badge>
                  {/if}
                  {#if policy.endDatetime}
                    <Badge variant="rosa">
                      Expires {policy.endDatetime.toLocaleDateString("sv")}
                    </Badge>
                  {/if}
                </div>
                {#if policy.information}
                  <p class="text-muted-foreground text-sm">
                    Reason: {policy.information}
                  </p>
                {/if}
              </div>
              <form method="POST" action="?/delete" class="ml-4">
                <input type="hidden" name="id" value={policy.id} />
                <Button type="submit" size="icon" aria-label="Delete">
                  <TrashIcon />
                </Button>
              </form>
            </li>
          {/each}
        </ul>
      </CardContent>
    {/if}
  </Card>
</div>
