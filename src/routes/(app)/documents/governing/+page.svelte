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
    <div
      class="flex flex-col gap-4 rounded-md border-[1px] border-l-4 border-l-primary p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <Scale class="size-6 text-primary" />
        {m.documents_governing_statutes()}
      </h2>
      <FileLink
        name={m.documents_governing_statutes()}
        url="/stadgar"
        host={false}
      />
    </div>
    <div
      class="flex flex-col gap-4 rounded-md border-[1px] border-l-4 border-l-primary p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <BookOpen class="size-6 text-primary" />
        {m.documents_governing_regulations()}
      </h2>
      <FileLink
        name={m.documents_governing_regulations()}
        url="/reglemente"
        host={false}
      />
    </div>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div
      class="flex flex-col gap-4 rounded-md border-[1px] border-l-4 border-l-primary p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck class="size-6 text-primary" />
        {m.documents_governing_policies()}
      </h2>
      {@render documentList(data.policies)}
    </div>
    <div
      class="flex flex-col gap-4 rounded-md border-[1px] border-l-4 border-l-primary p-4 shadow-sm"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <Map class="size-6 text-primary" />
        {m.documents_governing_guidelines()}
      </h2>
      {@render documentList(data.guidelines)}
    </div>
  </div>

  <div
    class="flex flex-col gap-4 rounded-md border-[1px] border-l-4 border-l-primary p-4 shadow-sm"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <Calendar class="size-6 text-primary" />
        {m.documents_governing_yearSpecificDocuments()}
      </h2>
      <YearSelector />
    </div>

    {@render documentList(data.plansOfOperations)}
    {@render documentList(data.frameworkBudgets)}
    {@render documentList(data.strategicGoals)}
  </div>
</div>
