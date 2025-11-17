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

  let { data }: PageProps = $props();
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
</div>
