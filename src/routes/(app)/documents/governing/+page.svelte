<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import FileLink from "../FileLink.svelte";
  import DeleteFileForm from "../DeleteFileForm.svelte";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as m from "$paraglide/messages";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Scale from "@lucide/svelte/icons/scale";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Map from "@lucide/svelte/icons/map";
  import Calendar from "@lucide/svelte/icons/calendar";
  import FileText from "@lucide/svelte/icons/file-text";
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
</script>

{#snippet documentList(documents: typeof data.policies)}
  <ul class="mt-2 space-y-2">
    {#each documents as doc (doc.id)}
      <li class="flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <FileLink name={doc.title} url={doc.url} host={true} />
        </div>
        {#if isEditing}
          <div class="flex shrink-0 items-center gap-2">
            {#if canUpdate}
              <Button
                href={`/documents/governing/${doc.id}/edit`}
                variant="outline"
                size="icon"
              >
                <Pencil class="size-4" />
              </Button>
            {/if}
            {#if canDelete}
              <DeleteFileForm
                data={data.deleteForm}
                fileId={doc.id}
                fileName={doc.title}
              />
            {/if}
          </div>
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
    <a
      href="/stadgar"
      target="_blank"
      class="group border-l-primary bg-primary/5 hover:bg-primary/10 flex flex-col justify-center gap-4 rounded-md border-[1px] border-l-4 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div class="flex items-center gap-4">
        <div class="bg-background rounded-full p-3 shadow-sm">
          <Scale class="text-primary size-8" />
        </div>
        <h2 class="text-2xl font-bold group-hover:underline">
          {m.documents_governing_statutes()}
        </h2>
      </div>
    </a>
    <a
      href="/reglemente"
      target="_blank"
      class="group border-l-primary bg-primary/5 hover:bg-primary/10 flex flex-col justify-center gap-4 rounded-md border-[1px] border-l-4 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div class="flex items-center gap-4">
        <div class="bg-background rounded-full p-3 shadow-sm">
          <BookOpen class="text-primary size-8" />
        </div>
        <h2 class="text-2xl font-bold group-hover:underline">
          {m.documents_governing_regulations()}
        </h2>
      </div>
    </a>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div
      class="border-l-primary flex flex-col gap-4 rounded-md border-[1px] border-l-4 p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck class="text-primary size-6" />
        {m.documents_governing_policies()}
      </h2>
      {@render documentList(data.policies)}
    </div>
    <div
      class="border-l-primary flex flex-col gap-4 rounded-md border-[1px] border-l-4 p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <Map class="text-primary size-6" />
        {m.documents_governing_guidelines()}
      </h2>
      {@render documentList(data.guidelines)}
    </div>
  </div>

  <div
    class="border-l-primary flex flex-col gap-4 rounded-md border-[1px] border-l-4 p-4 shadow-sm"
  >
    <div
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <h2 class="flex shrink-0 items-center gap-2 text-2xl font-bold">
        <Calendar class="text-primary size-6 shrink-0" />
        {m.documents_governing_yearSpecificDocuments()}
      </h2>
      <div
        class="flex w-full min-w-0 md:max-w-xs md:justify-end lg:max-w-sm xl:max-w-md"
      >
        <YearSelector />
      </div>
    </div>

    <div class="flex flex-row flex-wrap gap-2">
      <a href={data.plansOfOperations[0]?.url}>
        <Button
          disabled={!data.plansOfOperations[0]}
          variant="outline"
          class="cursor-pointer rounded-sm"
        >
          <FileText class="mr-2 size-4" />
          {m.documents_plansOfOperations()}
        </Button>
      </a>
      <a href={data.frameworkBudgets[0]?.url}>
        <Button
          disabled={!data.frameworkBudgets[0]}
          variant="outline"
          class="cursor-pointer rounded-sm"
        >
          <FileText class="mr-2 size-4" />
          {m.documents_frameworkBudgets()}
        </Button>
      </a>
      <a href={data.strategicGoals[0]?.url}>
        <Button
          disabled={!data.strategicGoals[0]}
          variant="outline"
          class="cursor-pointer rounded-sm"
        >
          <FileText class="mr-2 size-4" />
          {m.documents_strategicGoals()}
        </Button>
      </a>
    </div>

    {#if isEditing}
      <div class="flex flex-col gap-4">
        {#if data.plansOfOperations.length > 0}
          <div>
            <h3 class="text-lg font-semibold">
              {m.documents_plansOfOperations()}
            </h3>
            {@render documentList(data.plansOfOperations)}
          </div>
        {/if}
        {#if data.frameworkBudgets.length > 0}
          <div>
            <h3 class="text-lg font-semibold">
              {m.documents_frameworkBudgets()}
            </h3>
            {@render documentList(data.frameworkBudgets)}
          </div>
        {/if}
        {#if data.strategicGoals.length > 0}
          <div>
            <h3 class="text-lg font-semibold">
              {m.documents_strategicGoals()}
            </h3>
            {@render documentList(data.strategicGoals)}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
