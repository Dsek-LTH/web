<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as m from "$paraglide/messages";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Pencil from "@lucide/svelte/icons/pencil";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
  });
</script>

<div class="mx-auto w-full max-w-2xl px-4 py-8">
  <Button
    variant="ghost"
    href="/admin/tickets/{data.release.id}"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.ticketRelease_back()}
  </Button>

  <Card class="border-border overflow-hidden p-0 shadow-xl">
    <CardHeader class="bg-muted/50 border-border border-b-[1px] pt-6 pb-6">
      <div class="flex items-center gap-3">
        <div class="bg-lila-background/15 rounded-full p-2">
          <Pencil class="text-lila-background h-6 w-6" />
        </div>
        <CardTitle class="text-3xl font-bold">
          {m.ticketRelease_edit_title()}
        </CardTitle>
      </div>
      <CardDescription>{m.ticketRelease_edit_description()}</CardDescription>
    </CardHeader>
    <CardContent class="pt-6 pb-6">
      <form method="POST" use:enhance class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <Label for="title">{m.ticketRelease_field_title()}</Label>
          <Input
            id="title"
            name="title"
            bind:value={$form.title}
            required
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.title,
            }}
          />
          {#if $errors.title}
            <p class="text-destructive text-sm font-medium">
              {$errors.title}
            </p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="location">{m.ticketRelease_field_location()}</Label>
          <Input
            id="location"
            name="location"
            bind:value={$form.location}
            placeholder={m.ticketRelease_field_location_placeholder()}
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.location,
            }}
          />
          {#if $errors.location}
            <p class="text-destructive text-sm font-medium">
              {$errors.location}
            </p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="description">{m.ticketRelease_field_description()}</Label
          >
          <Textarea
            id="description"
            name="description"
            rows={4}
            bind:value={$form.description}
            placeholder={m.ticketRelease_field_description_placeholder()}
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.description,
            }}
          />
          {#if $errors.description}
            <p class="text-destructive text-sm font-medium">
              {$errors.description}
            </p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="quantity">{m.ticketRelease_field_quantity()}</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            bind:value={$form.quantity}
            required
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.quantity,
            }}
          />
          {#if $errors.quantity}
            <p class="text-destructive text-sm font-medium">
              {$errors.quantity}
            </p>
          {/if}
          <p class="text-muted-foreground text-sm">
            {m.ticketRelease_edit_quantity_hint()}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="closesAt">{m.ticketRelease_field_closesAt()}</Label>
          <Input
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            bind:value={$form.closesAt}
            required
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.closesAt,
            }}
          />
          {#if $errors.closesAt}
            <p class="text-destructive text-sm font-medium">
              {$errors.closesAt}
            </p>
          {/if}
        </div>

        <div class="mt-4 flex items-center justify-end gap-4">
          <Button
            type="submit"
            disabled={$delayed}
            class="flex min-w-32 items-center gap-2"
          >
            {#if $delayed}
              <Spinner class="h-4 w-4" />
            {:else}
              <Pencil class="h-4 w-4" />
              {m.ticketRelease_edit_submit()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
