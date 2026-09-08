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
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import PhadderGroupManageCard from "./PhadderGroupManageCard.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance } = superForm(data.form, {
    id: "create",
    resetForm: true,
  });
</script>

<SetPageTitle title={m.nollu_manage_pageTitle()} />

<div class="mx-auto max-w-4xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.nollu_manage_pageTitle()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.nollu_manage_createGroup()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="new-name">{m.nollu_manage_groupName()}</Label>
            <Input id="new-name" name="name" bind:value={$form.name} required />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="new-year">{m.nollu_manage_groupYear()}</Label>
            <Input
              id="new-year"
              name="year"
              type="number"
              bind:value={$form.year}
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <Label for="new-imageUrl">{m.nollu_manage_groupImage()}</Label>
          <Input id="new-imageUrl" name="imageUrl" bind:value={$form.imageUrl} />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="new-description">{m.nollu_manage_groupDescription()}</Label>
          <Textarea
            id="new-description"
            name="description"
            bind:value={$form.description}
          />
        </div>
        {#if $errors.name}
          <p class="text-destructive text-sm font-medium">{$errors.name}</p>
        {/if}
        <div class="flex justify-end">
          <Button type="submit" class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            {m.nollu_manage_createGroup()}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <div class="flex flex-col gap-6">
    {#each data.groups as group (group.id)}
      <PhadderGroupManageCard {group} />
    {/each}
  </div>
</div>
