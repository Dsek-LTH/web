<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import MandateField from "$lib/actic/MandateField.svelte";
  import PositionInput from "$lib/actic/PositionInput.svelte";
  import RowsBox from "$lib/actic/RowsBox.svelte";
  import { attachAction } from "$lib/actic/attachAction";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { parseIso, Writer } from "../writer.svelte";
  import { type TextRow } from "$lib/actic/fields";
  import type { DocumentInput, KeyedValue, MandateValue } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";
  import WriteShell from "../WriteShell.svelte";
  import BodyField from "../BodyField.svelte";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import X from "@lucide/svelte/icons/x";

  // Deterministic ids so SSR and hydration produce the same list keys.
  let rowSeq = 0;
  function nextRowId(): string {
    return `row-${rowSeq++}`;
  }

  let position = $state<KeyedValue | undefined>(undefined);
  let requirements = $state<TextRow[]>([{ id: nextRowId(), value: "" }]);
  let merits = $state<TextRow[]>([{ id: nextRowId(), value: "" }]);
  let mandate = $state<MandateValue>({
    mode: "year",
    year: new Date().getFullYear(),
  });

  const writer = new Writer({
    getInput: (): DocumentInput => ({
      ...writer.commonInput(),
      family: "requirements-profile",
      position: position ?? null,
      requirements: requirements.map((r) => r.value),
      merits: merits.map((r) => r.value),
      mandate: toMandateInput(mandate),
    }),
    applyFamilyDraft: (draft) => {
      position = draft.position;
      requirements = normalizeTextRows(
        (draft.requirements ?? []).map((value) => ({ id: nextRowId(), value })),
      );
      merits = normalizeTextRows(
        (draft.merits ?? []).map((value) => ({ id: nextRowId(), value })),
      );
      mandate = draft.mandate ?? mandate;
    },
    buildFamilyDraft: () => ({
      position,
      requirements: requirements.map((r) => r.value),
      merits: merits.map((r) => r.value),
      mandate,
    }),
  });

  function toMandateInput(value: MandateValue) {
    if (value.mode === "year") {
      return {
        mode: "year" as const,
        year: Number(value.year) || new Date().getFullYear(),
      };
    }
    return {
      mode: "custom" as const,
      from: parseIso(value.fromIso),
      to: parseIso(value.toIso),
    };
  }

  /** The shared add/remove/reorder ops for a plain text-row list. */
  function textListOps(get: () => TextRow[], set: (rows: TextRow[]) => void) {
    return {
      addRow(afterId?: string): string {
        const fresh: TextRow = { id: nextRowId(), value: "" };
        const rows = [...get()];
        if (afterId) {
          rows.splice(rows.findIndex((r) => r.id === afterId) + 1, 0, fresh);
        } else {
          rows.push(fresh);
        }
        set(rows);
        return fresh.id;
      },
      removeRow(id: string) {
        set(normalizeTextRows(get().filter((r) => r.id !== id)));
      },
      reorder(sourceId: string, slot: number) {
        const dragged = get().find((r) => r.id === sourceId);
        if (!dragged) return;
        const next = get().filter((r) => r.id !== sourceId);
        next.splice(slot, 0, dragged);
        set(normalizeTextRows(next));
      },
    };
  }

  /** Collapse back down to filled rows plus the one trailing free row. */
  function normalizeTextRows(rows: TextRow[]): TextRow[] {
    const free =
      rows.find((r) => !r.value.trim()) ?? { id: nextRowId(), value: "" };
    return [...rows.filter((r) => r.value.trim()), free];
  }

  const requirementOps = textListOps(
    () => requirements,
    (rows) => (requirements = rows),
  );
  const meritOps = textListOps(
    () => merits,
    (rows) => (merits = rows),
  );
</script>

<WriteShell {writer}>
  <div class="flex items-start gap-3">
    <div class="flex flex-1 flex-col gap-1.5">
      <Label for="position"
        >{m.actic_field_position()}
        <span class="text-destructive">*</span></Label
      >
      <PositionInput
        id="position"
        bind:position
        placeholder={m.actic_author_position_placeholder()}
      />
    </div>
  </div>
  <MandateField bind:value={mandate} />

  <BodyField {writer} label={m.actic_body_preamble()} />

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <Label>{m.actic_field_requirements()}</Label>
      <RowsBox
        ids={requirements.map((r) => r.id)}
        group="requirements"
        type="requirement"
        isFilled={(id) => !!requirements.find((r) => r.id === id)?.value.trim()}
        addRow={requirementOps.addRow}
        removeRow={requirementOps.removeRow}
        canDrag={(id) => !!requirements.find((r) => r.id === id)?.value.trim()}
        onreorder={requirementOps.reorder}
      >
        {#snippet children({ handle, isDragging, index: i, helpers })}
          {@const row = requirements[i]!}
          <div
            class={`flex items-stretch gap-1.5 pl-1 ${isDragging
              ? `${FIELD_BG} border-border rounded-md border shadow-md`
              : `border-border ${i > 0 ? "border-t" : ""}`}`}
          >
            {#if row.value.trim()}
              <span
                use:attachAction={handle}
                class="text-muted-foreground flex cursor-grab items-center"
                role="button"
                tabindex="0"
                aria-label={m.actic_author_drag()}
              >
                <GripVertical class="h-4 w-4" />
              </span>
            {:else}
              <!-- The free row: the grab indicator is disabled with it. -->
              <span
                class="text-muted-foreground flex items-center opacity-30"
                aria-hidden="true"
              >
                <GripVertical class="h-4 w-4" />
              </span>
            {/if}
            <div
              class="flex min-w-0 flex-1 items-center"
              use:helpers.trackInput={row.id}
            >
              <Input
                bind:value={row.value}
                placeholder={m.actic_requirements_placeholder()}
                class="rounded-none border-0 bg-transparent px-3 py-1 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
                oninput={helpers.oninput}
                onblur={helpers.onblur}
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    helpers.onenter();
                  } else if (e.key === "Escape") {
                    helpers.onescape();
                  }
                }}
              />
            </div>
            {#if row.value.trim()}
              <Button
                variant="ghost"
                size="icon-sm"
                class="self-center"
                aria-label={m.actic_yrkanden_remove()}
                onclick={() => requirementOps.removeRow(row.id)}
              >
                <X class="h-4 w-4" />
              </Button>
            {:else}
              <span class="flex items-center opacity-0" aria-hidden="true">
                <X class="h-4 w-4" />
              </span>
            {/if}
          </div>
        {/snippet}
      </RowsBox>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.actic_field_merits()}</Label>
      <RowsBox
        ids={merits.map((r) => r.id)}
        group="merits"
        type="merit"
        isFilled={(id) => !!merits.find((r) => r.id === id)?.value.trim()}
        addRow={meritOps.addRow}
        removeRow={meritOps.removeRow}
        canDrag={(id) => !!merits.find((r) => r.id === id)?.value.trim()}
        onreorder={meritOps.reorder}
      >
        {#snippet children({ handle, isDragging, index: i, helpers })}
          {@const row = merits[i]!}
          <div
            class={`flex items-stretch gap-1.5 pl-1 ${isDragging
              ? `${FIELD_BG} border-border rounded-md border shadow-md`
              : `border-border ${i > 0 ? "border-t" : ""}`}`}
          >
            {#if row.value.trim()}
              <span
                use:attachAction={handle}
                class="text-muted-foreground flex cursor-grab items-center"
                role="button"
                tabindex="0"
                aria-label={m.actic_author_drag()}
              >
                <GripVertical class="h-4 w-4" />
              </span>
            {:else}
              <!-- The free row: the grab indicator is disabled with it. -->
              <span
                class="text-muted-foreground flex items-center opacity-30"
                aria-hidden="true"
              >
                <GripVertical class="h-4 w-4" />
              </span>
            {/if}
            <div
              class="flex min-w-0 flex-1 items-center"
              use:helpers.trackInput={row.id}
            >
              <Input
                bind:value={row.value}
                placeholder={m.actic_merits_placeholder()}
                class="rounded-none border-0 bg-transparent px-3 py-1 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
                oninput={helpers.oninput}
                onblur={helpers.onblur}
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    helpers.onenter();
                  } else if (e.key === "Escape") {
                    helpers.onescape();
                  }
                }}
              />
            </div>
            {#if row.value.trim()}
              <Button
                variant="ghost"
                size="icon-sm"
                class="self-center"
                aria-label={m.actic_yrkanden_remove()}
                onclick={() => meritOps.removeRow(row.id)}
              >
                <X class="h-4 w-4" />
              </Button>
            {:else}
              <span class="flex items-center opacity-0" aria-hidden="true">
                <X class="h-4 w-4" />
              </span>
            {/if}
          </div>
        {/snippet}
      </RowsBox>
    </div>
  </div>
</WriteShell>
