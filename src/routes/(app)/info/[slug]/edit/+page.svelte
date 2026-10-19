<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import Editor from "$lib/components/Editor.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import { page } from "$app/state";

  let { data } = $props();

  let slug = $derived(page.params.slug ?? "");

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed } = superForm(data.form, {
    delayMs: 300,
  });

  let activeTab = $state<"sv" | "en">("sv");
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <Button
    variant="ghost"
    href="/info/{slug}"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.back()}
  </Button>

  <Card class="border-border shadow-xl">
    <CardHeader
      class="bg-primary/5 border-border flex flex-row items-center justify-between border-b-[1px] pb-6"
    >
      <CardTitle class="text-3xl font-bold">
        {data.isCreating
          ? m.info_edit_createTitle({ slug })
          : m.info_edit_editTitle({ slug })}
      </CardTitle>
      <ButtonGroup.Root>
        <Button
          type="button"
          variant={activeTab === "sv" ? "rosa" : "outline"}
          onclick={() => (activeTab = "sv")}
        >
          {m.language_swedish()}
        </Button>
        <Button
          type="button"
          variant={activeTab === "en" ? "rosa" : "outline"}
          onclick={() => (activeTab = "en")}
        >
          {m.language_english()}
        </Button>
      </ButtonGroup.Root>
    </CardHeader>
    <CardContent class="pt-6">
      <form
        method="POST"
        action={data.isCreating ? "?/create" : "?/update"}
        use:enhance
        class="flex flex-col gap-6"
      >
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
            bind:value={$form.markdownEn as string | undefined}
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
              {m.info_edit_save()}
            {/if}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
