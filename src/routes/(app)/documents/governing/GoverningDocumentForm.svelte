<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { GoverningDocumentSchema } from "./schemas";

  let {
    form: formData,
    action,
    title,
    submitLabel,
  }: {
    form: SuperValidated<GoverningDocumentSchema>;
    action: string;
    title: string;
    submitLabel: string;
  } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(formData, {
    delayMs: 300,
  });

  const typeLabels = {
    POLICY: m.documents_governing_policy(),
    GUIDELINE: m.documents_governing_guideline(),
  };
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
  <Button
    variant="ghost"
    href="/documents/governing"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold">{title}</CardTitle>
    </CardHeader>
    <CardContent class="pt-6">
      <form method="POST" {action} use:enhance class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <Label for="title">{m.documents_governing_title()}</Label>
          <Input id="title" name="title" bind:value={$form.title} required />
          {#if $errors.title}
            <p class="text-destructive text-sm font-medium">{$errors.title}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="url">{m.documents_governing_filePath()}</Label>
          <Input id="url" name="url" bind:value={$form.url} required />
          {#if $errors.url}
            <p class="text-destructive text-sm font-medium">{$errors.url}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="type">{m.documents_governing()}</Label>
          <Select.Root type="single" name="type" bind:value={$form.type}>
            <Select.Trigger id="type" class="w-full">
              {typeLabels[$form.type] ?? ""}
            </Select.Trigger>
            <Select.Content>
              {#each Object.entries(typeLabels) as [value, label] (value)}
                <Select.Item {value}>{label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.type}
            <p class="text-destructive text-sm font-medium">{$errors.type}</p>
          {/if}
        </div>

        <div class="mt-4 flex items-center justify-end">
          <Button
            type="submit"
            disabled={$delayed}
            class="flex min-w-32 items-center gap-2"
          >
            {#if $delayed}
              <Spinner class="h-4 w-4" />
            {:else}
              {submitLabel}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
