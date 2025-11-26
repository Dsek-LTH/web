<script lang="ts">
  import type { PageProps } from "./$types";
  import { enhance as svEnhance } from "$app/forms";
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
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "$lib/components/ui/alert-dialog";
  import * as m from "$paraglide/messages";

  let { data }: PageProps = $props();
  let door = $derived(data.door);
  let policies = $derived(data.doorAccessPolicies);
  const { form, errors, constraints, enhance } = superForm(data.createForm);

  const types = [
    { value: "member", label: m.admin_doors_member() },
    { value: "role", label: m.admin_doors_role() },
  ] as const;
  let typeTrigger = $derived.by(() => {
    const found = types.find((t) => t.value === $form.type);
    return found!.label;
  });

  const modes = [
    { value: "allow", label: m.admin_doors_allow() },
    { value: "deny", label: m.admin_doors_deny() },
  ] as const;
  let modeTrigger = $derived.by(() => {
    const found = modes.find((m) => m.value === $form.mode);
    return found!.label;
  });

  let open = $state(false);
  let selectedPolicy: (typeof data)["doorAccessPolicies"][number] | null =
    $state(null);
</script>

<div class="space-y-6">
  <!-- Form -->
  <Card>
    <CardHeader>
      <CardTitle>{m.admin_doors_addAccessRule()}</CardTitle>
      <CardDescription>
        {m.admin_doors_grantOrRestrict({ door: door.verboseName })}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" method="POST" action="?/create" use:enhance>
        <!-- TODO: display toast on success and form errors on failure -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="space-y-2 sm:col-span-2">
            <Label for="subject">
              {#if $form.type === "member"}
                {m.admin_doors_member()}
              {:else}
                {m.admin_doors_role()}
              {/if}
            </Label>
            <Input
              id="subject"
              name="subject"
              placeholder={$form.type === "member" ? "ab1234cd-s" : "dsek.cpu"}
              aria-invalid={$errors.subject ? "true" : undefined}
              bind:value={$form.subject}
              {...$constraints.subject}
            />
          </div>

          <div class="space-y-2">
            <Label for="type">{m.admin_doors_type()}</Label>
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
            <Label for="mode">{m.admin_doors_mode()}</Label>
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
            <Label for="start-date">{m.admin_doors_startDate()}</Label>
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
            <Label for="end-date">{m.admin_doors_endDate()}</Label>
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
          <Label for="entity-name">{m.admin_doors_reasonLabel()}</Label>
          <Input
            id="entity-name"
            placeholder={m.admin_doors_reasonPlaceholder()}
            name="reason"
            aria-invalid={$errors.reason ? "true" : undefined}
            bind:value={$form.reason}
            {...$constraints.reason}
          />
        </div>

        <Button type="submit" class="w-full">
          {m.admin_doors_add()}
        </Button>
      </form>
    </CardContent>
  </Card>

  <!-- Access policy list -->
  <Card>
    <CardHeader>
      <CardTitle>{m.admin_doors_currentRules()}</CardTitle>
      <CardDescription>
        {#if policies.length === 0}
          {m.admin_doors_noRules()}
        {:else}
          {m.admin_doors_numRules({ count: policies.length })}
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
                      {m.admin_doors_member()}
                    {:else}
                      {m.admin_doors_role()}
                    {/if}
                  </Badge>
                  {#if policy.isBan}
                    <Badge variant="rosa">{m.admin_doors_banned()}</Badge>
                  {/if}
                  {#if policy.endDatetime}
                    <Badge variant="rosa">
                      {m.admin_doors_expires()}
                      {policy.endDatetime.toLocaleDateString("sv")}
                    </Badge>
                  {/if}
                </div>
                {#if policy.information}
                  <p class="text-muted-foreground text-sm">
                    {m.admin_doors_reason()}: {policy.information}
                  </p>
                {/if}
              </div>

              <Button
                type="submit"
                size="icon"
                aria-label="Delete"
                onclick={() => {
                  open = true;
                  selectedPolicy = policy;
                }}
              >
                <TrashIcon />
              </Button>
            </li>
          {/each}
        </ul>
      </CardContent>
    {/if}
  </Card>
</div>

<!-- Delete dialog -->
<AlertDialog bind:open>
  {#if selectedPolicy}
    {@const subject =
      selectedPolicy.role ||
      getFullName(selectedPolicy.member!, { hideNickname: true })}
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{m.admin_doors_removeAccessRule()}</AlertDialogTitle>
        <AlertDialogDescription>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.admin_doors_areYouSure({ door: door.verboseName, subject })}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
        <form
          method="POST"
          action="?/delete"
          class="contents"
          use:svEnhance={() => {
            open = false;
          }}
        >
          <input type="hidden" name="id" value={selectedPolicy.id} />
          <AlertDialogAction type="submit">{m.save()}</AlertDialogAction>
        </form>
      </AlertDialogFooter>
    </AlertDialogContent>
  {/if}
</AlertDialog>
