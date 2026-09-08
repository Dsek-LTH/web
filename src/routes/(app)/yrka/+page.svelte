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
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Send from "@lucide/svelte/icons/send";
  import { Spinner } from "$lib/components/ui/spinner";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
    resetForm: true,
  });
</script>

<SetPageTitle title={m.yrka_title()} />

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold">{m.yrka_title()}</CardTitle>
      <CardDescription>{m.yrka_description()}</CardDescription>
    </CardHeader>
    <CardContent class="pt-6">
      <form method="POST" use:enhance class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <Label for="title" class="text-base font-medium"
            >{m.yrka_titleLabel()}</Label
          >
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
            <p class="text-destructive text-sm font-medium">{$errors.title}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="content" class="text-base font-medium"
            >{m.yrka_contentLabel()}</Label
          >
          <Textarea
            id="content"
            name="content"
            rows={10}
            bind:value={$form.content}
            required
            class={{
              "border-destructive focus-visible:ring-destructive":
                $errors.content,
            }}
          />
          {#if $errors.content}
            <p class="text-destructive text-sm font-medium">
              {$errors.content}
            </p>
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
              <Send class="h-4 w-4" />
              {m.yrka_submit()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
