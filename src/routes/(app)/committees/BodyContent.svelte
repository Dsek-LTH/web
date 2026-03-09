<script lang="ts">
  import { Button, buttonVariants } from "$lib/components/ui/button/";
  import Pen from "@lucide/svelte/icons/pen";

  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import Editor from "$lib/components/Editor.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import * as m from "$paraglide/messages";
  import { Input } from "$lib/components/ui/input";
  import SEO from "$lib/seo/SEO.svelte";
  import { page } from "$app/state";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { PageData } from "./[shortName]/$types";

  let { data }: { data: PageData } = $props();

  const { form, errors, enhance } = $derived(
    superForm(data.markdownForm!, { id: "markdown" }),
  );

  let activeTab = $state("sv");
  let committee = $derived(data.committee);
  let canEdit = $state(isAuthorized(apiNames.COMMITTEE.UPDATE, page.data.user));
</script>

{#if committee}
  <SEO data={{ type: "committee", committee }} />
{/if}

<div class="flex flex-row">
  <h2 class="mb-2">{m.committees_about()}</h2>
  {#if canEdit}
    <Dialog.Root>
      <Dialog.Trigger
        class={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "ml-auto",
        )}><Pen /> {m.committees_edit()}</Dialog.Trigger
      >
      <Dialog.Content class="mt-4 sm:max-w-2xl">
        <form action="?/updateCommitteeMarkdown" use:enhance method="POST">
          <Dialog.Header
            class="space-between mb-2 flex w-full flex-row items-center"
            ><Dialog.Title>{m.committees_edit_content()}</Dialog.Title
            ><ButtonGroup.Root class="mr-6 ml-auto">
              <Button
                type="button"
                class={activeTab == "sv"
                  ? "bg-neutral-200 dark:bg-neutral-900"
                  : ""}
                onclick={() => (activeTab = "sv")}
                variant="outline">{m.language_swedish()}</Button
              >
              <Button
                type="button"
                class={activeTab == "en"
                  ? "bg-neutral-100 dark:bg-neutral-900"
                  : ""}
                onclick={() => (activeTab = "en")}
                variant="outline">{m.language_english()}</Button
              >
            </ButtonGroup.Root></Dialog.Header
          >
          <div class="p-4 pt-2">
            <div class={activeTab == "sv" ? "block" : "hidden"}>
              <Editor
                name="markdownSv"
                bind:value={$form.markdownSv}
                aria-invalid={$errors.markdownSv ? true : false}
              />
            </div>
            <div class={activeTab == "en" ? "block" : "hidden"}>
              <Editor
                name="markdownEn"
                bind:value={$form.markdownEn as string | undefined}
                aria-invalid={$errors.markdownEn ? true : false}
              />
            </div>
            <div class="hidden">
              <Input
                type="text"
                name="markdownSlug"
                hidden
                bind:value={$form.markdownSlug}
              />
            </div>
          </div>

          <Dialog.Footer>
            <Dialog.Close class={buttonVariants({ variant: "outline" })}
              >{m.cancel()}</Dialog.Close
            >
            <Dialog.Close
              class={buttonVariants({ variant: "rosa" })}
              type="submit">{m.save()}</Dialog.Close
            >
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</div>
