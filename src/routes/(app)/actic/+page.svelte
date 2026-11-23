<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    DOCUMENT_TYPES,
    FAMILIES,
    getDocumentType,
  } from "$lib/actic/documents/dsek";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import {
    deleteDraft,
    listDrafts,
    type Draft,
  } from "$lib/actic/documents/drafts";
  import { diffGroupViews, type DiffGroupId } from "./landing-groups";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import FileDiff from "@lucide/svelte/icons/file-diff";
  import SquarePen from "@lucide/svelte/icons/square-pen";

  /** How many drafts the top grid shows before the "+ X till" card. */
  const RECENT_DRAFTS = 3;

  let { data }: { data: PageData } = $props();
  let drafts = $state<Draft[]>([]);
  /** Whether the drafts section shows every draft as a list. */
  let showAllDrafts = $state(false);

  const diffGroupLabels: Record<DiffGroupId, () => string> = {
    overview: m.actic_diff_group_overview,
    policies: m.documents_governing_policies,
    guidelines: m.documents_governing_guidelines,
  };

  // Drafts live in localStorage, so only read them on the client.
  onMount(() => {
    drafts = listDrafts();
  });

  function remove(id: string) {
    if (!window.confirm(m.actic_landing_delete_confirm())) return;
    deleteDraft(id);
    drafts = listDrafts();
  }

  const groups = $derived([
    {
      key: "meetings",
      label: m.actic_landing_group_meetings(),
      types: DOCUMENT_TYPES.filter(
        (t) => FAMILIES.find((f) => f.id === t.family)?.group === "meetings",
      ),
    },
    {
      key: "other",
      label: m.actic_landing_group_other(),
      types: DOCUMENT_TYPES.filter(
        (t) => FAMILIES.find((f) => f.id === t.family)?.group === "other",
      ),
    },
  ]);

  /** The most recent drafts, newest first. */
  const recentDrafts = $derived(
    [...drafts]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, RECENT_DRAFTS),
  );

  function relativeTime(timestamp: number): string {
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    const formatter = new Intl.RelativeTimeFormat(m.locale(), {
      numeric: "auto",
    });
    if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(-hours, "hour");
    return formatter.format(-Math.round(hours / 24), "day");
  }

  /** Per-row treatment shared by the two portals — rows sit inside the
   *  divided box (the same surface as the form fields), so the hover has to
   *  read on that tint rather than on the page background. */
  const ROW =
    "flex items-baseline justify-between gap-3 px-3 py-2 transition-colors hover:bg-foreground/5";
</script>

<SetPageTitle title={m.actic_title()} />

{#snippet draftCircle(draft: Draft)}
  <span
    class={`flex size-7 shrink-0 items-center justify-center rounded-full ${
      draft.kind === "diff"
        ? "bg-lila-100 text-lila-600 dark:bg-lila-400/15 dark:text-lila-300"
        : "bg-rosa-100 text-rosa-600 dark:bg-rosa-400/15 dark:text-rosa-300"
    }`}
  >
    {#if draft.kind === "diff"}
      <FileDiff class="size-4" />
    {:else}
      <SquarePen class="size-4" />
    {/if}
  </span>
{/snippet}

{#snippet draftTitle(draft: Draft)}
  {#if draft.kind === "diff"}
    <a
      href={resolve(`/actic/diff/${draft.slug}?draft=${draft.id}`)}
      class="block truncate text-sm font-medium after:absolute after:inset-0 after:rounded-lg"
    >
      {draft.title}
    </a>
  {:else}
    <a
      href={resolve(`/actic/write/${draft.family}?draft=${draft.id}`)}
      class="block truncate text-sm font-medium after:absolute after:inset-0 after:rounded-lg"
    >
      {draft.title || draft.meeting || m.actic_landing_untitled()}
    </a>
  {/if}
{/snippet}

{#snippet draftMeta(draft: Draft)}
  {#if draft.kind === "diff"}
    {m.actic_diff_draft_label()} — {relativeTime(draft.updatedAt)}
  {:else}
    {getDocumentType(draft.type).label()}{draft.meeting
      ? " · " + draft.meeting
      : ""} — {relativeTime(draft.updatedAt)}
  {/if}
{/snippet}

<div class="layout-container flex flex-col gap-8">
  <div class="flex max-w-2xl flex-col gap-1">
    <h1 class="text-3xl font-bold">{m.actic_title()}</h1>
    <p class="text-muted-foreground">{m.actic_description()}</p>
  </div>

  {#if drafts.length > 0}
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-bold tracking-widest uppercase">
          {m.actic_landing_drafts()}
        </h2>
        {#if drafts.length > RECENT_DRAFTS}
          <button
            type="button"
            class="text-rosa-600 dark:text-rosa-300 text-sm font-medium hover:underline"
            onclick={() => (showAllDrafts = !showAllDrafts)}
          >
            {#if showAllDrafts}
              {m.actic_landing_show_fewer()}
            {:else}
              {m.actic_landing_show_all_drafts()}
            {/if}
          </button>
        {/if}
      </div>
      {#if showAllDrafts}
        <!-- The full list, one divided box — white like the collapsed cards. -->
        <div
          class="border-border divide-border divide-y overflow-hidden rounded-lg border shadow-xs"
        >
          {#each drafts as draft (draft.id)}
            <div
              class="hover:bg-secondary-hover relative flex items-center gap-2.5 p-3 transition-colors"
            >
              {@render draftCircle(draft)}
              <div class="min-w-0 flex-1">
                {@render draftTitle(draft)}
                <p class="text-muted-foreground mt-0.5 truncate text-xs">
                  {@render draftMeta(draft)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                class="relative z-10"
                aria-label={m.actic_landing_delete()}
                onclick={() => remove(draft.id)}
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          {/each}
        </div>
      {:else}
        <!-- One row of the most recent drafts. -->
        <div
          class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {#each recentDrafts as draft (draft.id)}
            <div
              class="border-border hover:border-foreground/30 relative flex items-center gap-2.5 rounded-lg border p-3 transition-colors hover:shadow-sm"
            >
              {@render draftCircle(draft)}
              <div class="min-w-0 flex-1">
                {@render draftTitle(draft)}
                <p class="text-muted-foreground mt-0.5 truncate text-xs">
                  {@render draftMeta(draft)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                class="relative z-10"
                aria-label={m.actic_landing_delete()}
                onclick={() => remove(draft.id)}
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          {/each}
          {#if drafts.length > RECENT_DRAFTS}
            <button
              type="button"
              class="text-muted-foreground hover:border-foreground/30 hover:text-foreground flex items-center justify-center self-stretch rounded-lg border p-3 text-sm transition-colors hover:shadow-sm"
              onclick={() => (showAllDrafts = true)}
            >
              {m.actic_landing_more_drafts({
                count: drafts.length - RECENT_DRAFTS,
              })}
            </button>
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
    <!-- Write portal: every document type, one row each. -->
    <section
      class="border-border bg-background flex flex-col rounded-lg border p-5"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="bg-rosa-100 text-rosa-600 dark:bg-rosa-400/15 dark:text-rosa-300 flex size-7 items-center justify-center rounded-full"
        >
          <SquarePen class="size-4" />
        </span>
        <h2 class="text-base font-semibold">{m.actic_landing_write_title()}</h2>
      </div>
      <p class="text-muted-foreground mt-1.5 text-sm">
        {m.actic_landing_write_description()}
      </p>
      {#each groups as group (group.key)}
        {#if group.types.length > 0}
          <h3 class="text-muted-foreground mt-4 mb-1 text-xs font-medium">
            {group.label}
          </h3>
          <!-- One divided box per group, like the expanded drafts list. -->
          <div
            class="border-border bg-muted-background divide-border divide-y overflow-hidden rounded-lg border shadow-xs"
          >
            {#each group.types as type (type.id)}
              <a
                href={resolve(`/actic/write/${type.family}`)}
                class={ROW}
                title={type.blurb()}
                onclick={() => sessionStorage.setItem("actic.newType", type.id)}
              >
                <span class="shrink-0 text-sm">{type.label()}</span>
                <span
                  class="text-muted-foreground min-w-0 truncate text-right text-xs"
                >
                  {type.blurb()}
                </span>
              </a>
            {/each}
          </div>
        {/if}
      {/each}
      <!-- Equal breathing room above and below (~2 text lines each), since the
           section now sizes to its own content instead of matching the diff
           portal's height. -->
      <p class="text-muted-foreground my-8 text-center text-xs leading-relaxed">
        {m.actic_landing_write_hint()}
        <a class="link" href="https://typst.app/universe/package/dsek">
          {m.actic_landing_write_hint_link()}
        </a>
        {m.actic_landing_write_hint_after()}
      </p>
    </section>

    <!-- Diff portal: the governing documents, grouped for browsing. -->
    <section
      class="border-border bg-background flex flex-col rounded-lg border p-5"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="bg-lila-100 text-lila-600 dark:bg-lila-400/15 dark:text-lila-300 flex size-7 items-center justify-center rounded-full"
        >
          <FileDiff class="size-4" />
        </span>
        <h2 class="text-base font-semibold">
          {m.documents_governing_editDocument()}
        </h2>
        <span
          class="bg-rosa-100 text-rosa-600 dark:bg-rosa-400/15 dark:text-rosa-300 rounded-full px-2 py-0.5 text-xs font-bold tracking-widest uppercase"
        >
          Beta
        </span>
      </div>
      <p class="text-muted-foreground mt-1.5 text-sm">
        {m.actic_diff_description()}
      </p>
      {#await data.catalog}
        <span
          class="text-muted-foreground mt-4 flex items-center gap-2 text-sm"
        >
          <Spinner class="h-4 w-4" />
          {m.actic_landing_loading()}
        </span>
      {:then result}
        {#if result.governingCatalogError}
          <p class="text-muted-foreground mt-4 text-sm">
            {m.actic_diff_upstream_error()}
          </p>
        {:else}
          {#each diffGroupViews(result.governingCatalog) as group (group.id)}
            <h3 class="text-muted-foreground mt-4 mb-1 text-xs font-medium">
              {diffGroupLabels[group.id]()}
            </h3>
            <!-- One divided box per group, like the expanded drafts list. -->
            <div
              class="border-border bg-muted-background divide-border divide-y overflow-hidden rounded-lg border shadow-xs"
            >
              {#each group.docs as document (document.slug)}
                <a href={resolve(`/actic/diff/${document.slug}`)} class={ROW}>
                  <span class="text-sm">{document.title}</span>
                </a>
              {/each}
            </div>
          {/each}
        {/if}
      {/await}
    </section>
  </div>
</div>
