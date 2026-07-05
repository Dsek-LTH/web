<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import FileLink from "../FileLink.svelte";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as m from "$paraglide/messages";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import Pencil from "@lucide/svelte/icons/pencil";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  let canCreate = $derived(
    isAuthorized(apiNames.GOVERNING_DOCUMENT.CREATE, data.user),
  );
  let canUpdate = $derived(
    isAuthorized(apiNames.GOVERNING_DOCUMENT.UPDATE, data.user),
  );
  let canDelete = $derived(
    isAuthorized(apiNames.GOVERNING_DOCUMENT.DELETE, data.user),
  );
  let canEdit = $derived(canUpdate || canDelete);

  let selectedType = $derived(
    page.url.searchParams.get("type") || "plansOfOperations",
  );

  const generateLink = $derived((value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("type", value);
    return `?${searchParams.toString()}`;
  });
</script>

{#snippet documentList(documents: typeof data.policies)}
  <ul class="mt-2 space-y-2">
    {#each documents as doc (doc.id)}
      <li class="flex items-center gap-2">
        <FileLink name={doc.title} url={doc.url} host={true} />
        {#if isEditing}
          {#if canUpdate}
            <a
              href={`/documents/governing/${doc.id}/edit`}
              class="text-muted-foreground hover:text-foreground"
            >
              <Pencil class="size-4" />
            </a>
          {/if}
          {#if canDelete}
            <DeleteFileForm
              data={data.deleteForm}
              fileId={doc.id}
              fileName={doc.title}
            />
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<div class="layout-container">
  <div class="flex flex-row justify-between gap-8 *:w-full">
    <PageHeader title={m.documents_governing()} />
  </div>

  {#if canCreate || canEdit}
    <div class="mb-4 flex gap-2">
      {#if canCreate}
        <Button href="/documents/governing/new" variant="rosa" size="sm">
          + {m.documents_governing_createNew()}
        </Button>
      {/if}
      {#if canEdit}
        <Button
          variant="lila"
          size="sm"
          onclick={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? m.documents_stopEditing() : m.documents_edit()}
        </Button>
      {/if}
    </div>
  {/if}

  <div class="prose dark:prose-invert mb-8">
    <p>{m.documents_governing_blurb()}</p>
    <p>
      {m.documents_governing_forQuestions()}
      <a href="mailto:styrelsen@dsek.se" class="text-primary hover:underline"
        >styrelsen@dsek.se</a
      >
    </p>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div class="flex flex-col gap-4 rounded-md border-[1px] p-4">
      <h2 class="text-2xl font-bold">{m.documents_governing_statutes()}</h2>
      <FileLink
        name={m.documents_governing_statutes()}
        url="/stadgar"
        host={false}
      />
    </div>
    <div class="flex flex-col gap-4 rounded-md border-[1px] p-4">
      <h2 class="text-2xl font-bold">{m.documents_governing_regulations()}</h2>
      <FileLink
        name={m.documents_governing_regulations()}
        url="/reglemente"
        host={false}
      />
    </div>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div class="flex flex-col gap-4 rounded-md border-[1px] p-4">
      <h2 class="text-2xl font-bold">{m.documents_governing_policies()}</h2>
      {@render documentList(data.policies)}
    </div>
    <div class="flex flex-col gap-4 rounded-md border-[1px] p-4">
      <h2 class="text-2xl font-bold">{m.documents_governing_guidelines()}</h2>
      {@render documentList(data.guidelines)}
    </div>
  </div>

  <div class="flex flex-col gap-4 rounded-md border-[1px] p-4">
    <h2 class="text-2xl font-bold">
      {m.documents_governing_yearSpecificDocuments()}
    </h2>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Tabs.Root value={selectedType}>
        <Tabs.List>
          <a href={generateLink("plansOfOperations")}>
            <Tabs.Trigger value="plansOfOperations">
              {m.documents_plansOfOperations()}
            </Tabs.Trigger>
          </a>
          <a href={generateLink("frameworkBudgets")}>
            <Tabs.Trigger value="frameworkBudgets">
              {m.documents_frameworkBudgets()}
            </Tabs.Trigger>
          </a>
          <a href={generateLink("strategicGoals")}>
            <Tabs.Trigger value="strategicGoals">
              {m.documents_strategicGoals()}
            </Tabs.Trigger>
          </a>
        </Tabs.List>
      </Tabs.Root>
      <YearSelector />
    </div>

    {@render documentList(
      selectedType === "plansOfOperations"
        ? data.plansOfOperations
        : selectedType === "frameworkBudgets"
          ? data.frameworkBudgets
          : data.strategicGoals,
    )}
  </div>
</div>
