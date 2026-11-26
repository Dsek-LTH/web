<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import RowsBox from "./RowsBox.svelte";
  import { attachAction } from "./attachAction";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { nextId, type YrkandeRow } from "$lib/actic/documents/fields";
  import { ghostDealer } from "$lib/actic/write/ghost-texts.svelte";
  import * as m from "$paraglide/messages";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import X from "@lucide/svelte/icons/x";

  let {
    leadIn = $bindable(""),
    items = $bindable([] as YrkandeRow[]),
    lang = "sv",
    clausePool,
  }: {
    leadIn?: string;
    items?: YrkandeRow[];
    /** The document language, which the resolution wording follows. */
    lang?: "sv" | "en";
    /**
     * Ghost texts the att-sats rows rotate among — dealt per row in a
     * shuffled order, each pool string used once before any repeats, and a
     * row keeps its ghost while it lives. Defaults to the shared single
     * example.
     */
    clausePool?: string[];
  } = $props();

  const fallbackClausePool = $derived([
    m.actic_yrkanden_clause_placeholder({}, { locale: lang }),
  ]);
  const activeClausePool = $derived(clausePool ?? fallbackClausePool);
  // A fresh dealer per pool CONTENT (not identity — the parent re-renders
  // hand us new arrays with the same strings, and re-dealing would reshuffle
  // every visible placeholder on every keystroke).
  let dealerForPoolKey: string | null = null;
  let dealer: ((rowId: string) => string) | undefined;
  const dealClauseGhost = $derived.by(() => {
    const key = activeClausePool.join("\u0000");
    if (key !== dealerForPoolKey) {
      dealerForPoolKey = key;
      dealer = ghostDealer(activeClausePool);
    }
    return dealer!;
  });

  /** Which rows show their description box. Closed by default. */
  let expanded = $state<Record<string, boolean>>({});

  function emptyYrkande(): YrkandeRow {
    return { id: nextId("yrk"), clause: "", description: "" };
  }
  function addRow(afterId?: string): string {
    const fresh = emptyYrkande();
    if (afterId) {
      const at = items.findIndex((r) => r.id === afterId) + 1;
      items = [...items.slice(0, at), fresh, ...items.slice(at)];
    } else {
      items = [...items, fresh];
    }
    return fresh.id;
  }
  function removeRow(id: string) {
    const next = items.filter((r) => r.id !== id);
    // Normalize back down to filled rows plus the one trailing free row.
    const free = next.find((r) => !r.clause.trim()) ?? emptyYrkande();
    items = [...next.filter((r) => r.clause.trim()), free];
  }
  function remove(i: number) {
    removeRow(items[i]!.id);
  }

  function toggleExpand(id: string) {
    expanded[id] = !expanded[id];
  }

  function reorder(sourceId: string, slot: number) {
    const dragged = items.find((r) => r.id === sourceId);
    if (!dragged) return;
    const next = items.filter((r) => r.id !== sourceId);
    next.splice(slot, 0, dragged);
    // Collapse back down to filled rows plus the one trailing free row.
    const free = next.find((r) => !r.clause.trim()) ?? emptyYrkande();
    items = [...next.filter((r) => r.clause.trim()), free];
  }
</script>

<div class="flex flex-col gap-2.5">
  <Label>{m.actic_yrkanden_title()}</Label>
  <Input
    id="leadIn"
    class={FIELD_BG}
    bind:value={leadIn}
    placeholder={m.actic_yrkanden_leadIn_placeholder({}, { locale: lang })}
  />
  <RowsBox
    ids={items.map((r) => r.id)}
    group="yrkanden"
    type="yrkande"
    isFilled={(id) => !!items.find((r) => r.id === id)?.clause.trim()}
    {addRow}
    {removeRow}
    canDrag={(id) => !!items.find((r) => r.id === id)?.clause.trim()}
    onreorder={reorder}
  >
    {#snippet children({ handle, isDragging, isDropping, index: i, helpers })}
      {@const row = items[i]!}
      {@const open =
        !!row.clause.trim() && (expanded[row.id] ?? !!row.description.trim())}
      <div
        class={`flex flex-col ${
          // Keep the raised look through the drop animation — the row
          // shouldn't morph into its plain form until it lands.
          isDragging || isDropping
            ? `${FIELD_BG} border-border rounded-md border shadow-md`
            : `border-border ${i > 0 ? "border-t" : ""}`
        }`}
      >
        <div class="flex items-stretch gap-1 pl-1">
          <!-- The clause text is text-sm at every width (like the plain
               inputs), so the handle and "att" chip center against the same
               36px row on all screens. -->
          {#if row.clause.trim()}
            <span
              use:attachAction={handle}
              class="text-muted-foreground flex h-9 cursor-grab items-center gap-1 self-start"
              role="button"
              tabindex="0"
              aria-label={m.actic_author_drag()}
            >
              <GripVertical class="h-4 w-4" />
              <span class="relative top-px mr-1 text-xs">{i + 1}</span>
            </span>
          {:else}
            <!-- The free row: the grab indicator is disabled with it. -->
            <span
              class="text-muted-foreground flex h-9 items-center gap-1 self-start opacity-30"
              aria-hidden="true"
            >
              <GripVertical class="h-4 w-4" />
              <span class="relative top-px mr-1 text-xs">{i + 1}</span>
            </span>
          {/if}
          <span
            class="text-muted-foreground flex h-9 items-center self-start text-sm font-bold"
            >{m.actic_yrkanden_att({}, { locale: lang })}</span
          >
          <div
            class="relative flex min-w-0 flex-1 flex-col"
            use:helpers.trackInput={row.id}
          >
            <Textarea
              bind:value={row.clause}
              placeholder=""
              class="min-h-9 resize-none border-0 bg-transparent py-2 pr-3 pl-0.5 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
              oninput={helpers.oninput}
              onblur={helpers.onblur}
              onkeydown={(e) => {
                // Enter adds a row (Shift+Enter makes a newline).
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  helpers.onenter();
                } else if (e.key === "Escape") {
                  helpers.onescape();
                }
              }}
            />
            {#if !row.clause.trim()}
              <!-- The ghost text rides on an overlay rather than the
                   textarea's placeholder: a long ghost must cut off with an
                   ellipsis, and Chrome's textarea placeholder only ever
                   clips (its nowrap variant also forced a scrollbar at high
                   zoom). Same padding/typography as the textarea's first
                   line, so it sits exactly where the text will. -->
              <span
                aria-hidden="true"
                class="text-muted-foreground pointer-events-none absolute top-2 right-3 left-0.5 truncate text-sm"
              >
                {dealClauseGhost(row.id)}
              </span>
            {/if}
            {#if open}
              <!-- The description sub-box, contained within the row. -->
              <div class="py-2 pr-3 pl-0.5">
                <Textarea
                  bind:value={row.description}
                  placeholder={m.actic_yrkanden_desc_placeholder(
                    {},
                    { locale: lang },
                  )}
                  class="{FIELD_BG} min-h-9 resize-none text-sm"
                />
              </div>
            {/if}
          </div>
          {#if row.clause.trim()}
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground flex h-9 items-center gap-1 self-start px-1"
              aria-label={m.actic_yrkanden_description()}
              aria-expanded={open}
              onclick={() => toggleExpand(row.id)}
            >
              {#if open}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <!-- Dot marks a collapsed description that isn't empty. -->
                {#if row.description.trim()}
                  <span class="bg-primary size-1.5 rounded-full"></span>
                {/if}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              class="mt-0.5 self-start"
              aria-label={m.actic_yrkanden_remove()}
              onclick={() => remove(i)}
            >
              <X class="h-4 w-4" />
            </Button>
          {:else}
            <!-- The free row: nothing to expand or remove. -->
            <span
              class="flex h-9 items-center self-start px-1 opacity-0"
              aria-hidden="true"
            >
              <ChevronRight class="h-4 w-4" />
            </span>
            <span
              class="flex h-9 items-center self-start opacity-0"
              aria-hidden="true"
            >
              <X class="h-4 w-4" />
            </span>
          {/if}
        </div>
      </div>
    {/snippet}
  </RowsBox>
</div>
