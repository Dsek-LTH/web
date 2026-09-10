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
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import Editor from "$lib/components/Editor.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
  });

  let activeTab = $state<"sv" | "en">("sv");
</script>

<SetPageTitle title={m.admin_info_createNewInfoPage()} />

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <Card class="border-border shadow-xl">
    <CardHeader class="bg-primary/5 border-border border-b-[1px] pb-6">
      <CardTitle class="text-3xl font-bold"
        >{m.admin_info_createNewInfoPage()}</CardTitle
      >
    </CardHeader>
    <CardContent class="flex flex-col gap-6 pt-6">
      <div class="flex flex-col gap-2">
        <Label for="name">{m.admin_info_name()}</Label>
        <Input
          id="name"
          name="name"
          bind:value={$form.name}
          form="create-form"
          required
        />
        {#if $errors.name}
          <p class="text-destructive text-sm font-medium">{$errors.name}</p>
        {/if}
      </div>

      <form
        id="create-form"
        method="POST"
        action="?/create"
        use:enhance
        class="flex flex-col gap-6"
      >
        <div class="flex items-center justify-between">
          <Label>{m.admin_info_content()}</Label>
          <ButtonGroup.Root>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "sv" ? "rosa" : "outline"}
              onclick={() => (activeTab = "sv")}
            >
              {m.language_swedish()}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "en" ? "rosa" : "outline"}
              onclick={() => (activeTab = "en")}
            >
              {m.language_english()}
            </Button>
          </ButtonGroup.Root>
        </div>
        <div class={activeTab === "sv" ? "block" : "hidden"}>
          <Editor
            name="markdownSv"
            bind:value={$form.markdownSv}
            aria-invalid={!!$errors.markdownSv}
          />
          {#if $errors.markdownSv}
            <p class="text-destructive text-sm font-medium">
              {$errors.markdownSv}
            </p>
          {/if}
        </div>
        <div class={activeTab === "en" ? "block" : "hidden"}>
          <Editor
            name="markdownEn"
            bind:value={$form.markdownEn}
            aria-invalid={!!$errors.markdownEn}
          />
          {#if $errors.markdownEn}
            <p class="text-destructive text-sm font-medium">
              {$errors.markdownEn}
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
              <Plus class="h-4 w-4" />
              {m.admin_info_create()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
