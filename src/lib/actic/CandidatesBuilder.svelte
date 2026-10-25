<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { move } from "@dnd-kit/helpers";
  import { Button } from "$lib/components/ui/button/index.js";
  import MemberNameInput from "$lib/actic/MemberNameInput.svelte";
  import PositionInput from "$lib/actic/PositionInput.svelte";
  import RowsBox from "$lib/actic/RowsBox.svelte";
  import SortableItem from "$lib/actic/SortableItem.svelte";
  import { attachAction } from "$lib/actic/attachAction";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { nextId, type CandidateRow, type NomineeRow } from "$lib/actic/fields";
  import * as m from "$paraglide/messages";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import X from "@lucide/svelte/icons/x";

  let {
    candidates = $bindable([] as CandidateRow[]),
    statsEnabled = $bindable(false),
  }: {
    candidates?: CandidateRow[];
    statsEnabled?: boolean;
  } = $props();

  let snapshot = $state<CandidateRow[]>([]);

  // --- statistics stepper ----------------------------------------------------
  // Applicant counts are chosen in steps of five ("0 -- 4", "5 -- 9", …),
  // shown with an em dash but input as `--` (which Typst renders as a dash).
  const STAT_STEP = 5;
  const STAT_DASH = "—";
  /**
   * The interval index a stat parses to, or null when it parses to nothing
   * (which disables the stepper arrows). Free-form ranges like `0 -- 4`,
   * `0-4` and `0--4` all parse.
   */
  function statBaseIndex(stat: string): number | null {
    const trimmed = stat.trim();
    if (!trimmed) return 0; // empty behaves as the first interval
    const match = /^(\d+)\s*-{1,2}\s*(\d+)$/.exec(trimmed);
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    return end >= start ? Math.floor(start / STAT_STEP) : null;
  }
  /** Display value with a single em dash. */
  function statLabel(stat: string): string {
    const trimmed = stat.trim();
    if (!trimmed) return `0 ${STAT_DASH} 4`;
    return trimmed.replace(/(\d)\s*-{1,2}\s*(\d)/g, `$1 ${STAT_DASH} $2`);
  }
  /** The stored value for an interval index, e.g. `0 -- 4`. */
  function statValue(index: number): string {
    return `${index * STAT_STEP} -- ${index * STAT_STEP + STAT_STEP - 1}`;
  }
  /** Leaving the editor empty commits the displayed default, never a ghost. */
  function commitStatEdit(candidate: CandidateRow) {
    if (!candidate.stat.trim()) candidate.stat = statValue(0);
    editingStatId = null;
  }

  /** The id of the candidate whose applicant count is being typed freely. */
  let editingStatId = $state<string | null>(null);
  function focusOnMount(node: HTMLInputElement) {
    node.focus();
    // The value binding assigns the value after mount, which resets the
    // selection — select once that has settled.
    setTimeout(() => node.select(), 0);
  }

  // --- candidates & nominees -------------------------------------------------
  function emptyNominee(): NomineeRow {
    return { id: nextId("nom"), name: "" };
  }
  function emptyCandidate(): CandidateRow {
    return {
      id: nextId("cand"),
      nominees: [emptyNominee()],
      // The stepper always carries real data — the first interval by default.
      stat: statValue(0),
    };
  }
  function addCandidate() {
    candidates = [...candidates, emptyCandidate()];
  }
  function removeCandidate(ci: number) {
    candidates = candidates.filter((_, i) => i !== ci);
  }
  /** Creates a nominee row (after `afterId`, or at the end) and returns its id. */
  function addNomineeRow(candidateId: string, afterId?: string): string {
    const fresh = emptyNominee();
    candidates = candidates.map((c) => {
      if (c.id !== candidateId) return c;
      if (!afterId) return { ...c, nominees: [...c.nominees, fresh] };
      const at = c.nominees.findIndex((n) => n.id === afterId) + 1;
      const nominees = [...c.nominees];
      nominees.splice(at, 0, fresh);
      return { ...c, nominees };
    });
    return fresh.id;
  }
  function removeNomineeRow(candidateId: string, id: string) {
    candidates = candidates.map((c) => {
      if (c.id !== candidateId) return c;
      const next = c.nominees.filter((n) => n.id !== id);
      // Normalize back down to filled rows plus the one trailing free row.
      const free = next.find((n) => !n.name.trim()) ?? emptyNominee();
      return { ...c, nominees: [...next.filter((n) => n.name.trim()), free] };
    });
  }
  function removeNominee(ci: number, ni: number) {
    const candidate = candidates[ci];
    const nominee = candidate?.nominees[ni];
    if (candidate && nominee) removeNomineeRow(candidate.id, nominee.id);
  }

  function onDragOver(event: Parameters<typeof move>[1]) {
    const sourceId = String(event.operation.source?.id ?? "");
    // Position groups reorder with the projected-index helper; nominee rows
    // reorder inside their own RowsBox.
    if (candidates.some((c) => c.id === sourceId)) {
      candidates = move(candidates, event);
    }
  }

  /** Nominee reorder from the RowsBox: land the row in the given slot. */
  function reorderNominee(candidateId: string, sourceId: string, slot: number) {
    candidates = candidates.map((c) => {
      if (c.id !== candidateId) return c;
      const dragged = c.nominees.find((n) => n.id === sourceId);
      if (!dragged) return c;
      const next = c.nominees.filter((n) => n.id !== sourceId);
      next.splice(slot, 0, dragged);
      // Collapse back down to filled rows plus the one trailing free row.
      const free = next.find((n) => !n.name.trim()) ?? emptyNominee();
      return { ...c, nominees: [...next.filter((n) => n.name.trim()), free] };
    });
  }
</script>

<div class="flex flex-col gap-3">
  <DragDropProvider
    onDragStart={() => (snapshot = $state.snapshot(candidates))}
    {onDragOver}
    onDragEnd={(event) => {
      if (event.canceled) candidates = snapshot;
    }}
  >
    {#each candidates as candidate, ci (candidate.id)}
      <SortableItem
        id={candidate.id}
        index={ci}
        group="candidates"
        type="candidate"
        accept="candidate"
      >
        {#snippet children({ handle })}
          <div class="border-border flex flex-col gap-2 rounded-md border p-2">
            <div class="flex items-center gap-2">
              <span
                use:attachAction={handle}
                class="text-muted-foreground flex cursor-grab items-center"
                role="button"
                tabindex="0"
                aria-label={m.actic_author_drag()}
              >
                <GripVertical class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <PositionInput
                  bind:position={candidate.position}
                  placeholder={m.actic_candidate_position()}
                />
              </div>
              {#if statsEnabled}
                <!-- Applicant-count stepper: arrows walk the intervals; the
                     number itself is click-to-edit for custom ranges. -->
                <div
                  class="border-border flex h-9 w-32 shrink-0 items-center overflow-hidden rounded-md border"
                >
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground flex h-full items-center px-1 disabled:pointer-events-none disabled:opacity-50"
                    aria-label={m.actic_stats_decrease()}
                    disabled={
                      statBaseIndex(candidate.stat) === null ||
                      statBaseIndex(candidate.stat) === 0
                    }
                    onclick={() => {
                      const base = statBaseIndex(candidate.stat);
                      if (base === null || base === 0) return;
                      candidate.stat = statValue(base - 1);
                    }}
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </button>
                  {#if editingStatId === candidate.id}
                    <input
                      use:focusOnMount
                      class="h-full w-full min-w-0 bg-transparent px-1 text-center text-sm outline-none"
                      bind:value={candidate.stat}
                      onblur={() => commitStatEdit(candidate)}
                      onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          e.preventDefault();
                          commitStatEdit(candidate);
                        }
                      }}
                    />
                  {:else}
                    <button
                      type="button"
                      class="h-full min-w-0 flex-1 text-center text-sm"
                      aria-label={m.actic_stats_label()}
                      onclick={() => {
                        // Pre-fill with what is displayed, in canonical
                        // `--` form, selected so typing replaces it.
                        const trimmed = candidate.stat.trim();
                        candidate.stat = trimmed
                          ? trimmed.replace(
                              /(\d)\s*-{1,2}\s*(\d)/g,
                              "$1 -- $2",
                            )
                          : statValue(0);
                        editingStatId = candidate.id;
                      }}
                    >
                      {statLabel(candidate.stat)}
                    </button>
                  {/if}
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground flex h-full items-center px-1 disabled:pointer-events-none disabled:opacity-50"
                    aria-label={m.actic_stats_increase()}
                    disabled={statBaseIndex(candidate.stat) === null}
                    onclick={() => {
                      const base = statBaseIndex(candidate.stat);
                      if (base === null) return;
                      candidate.stat = statValue(base + 1);
                    }}
                  >
                    <ChevronRight class="h-4 w-4" />
                  </button>
                </div>
              {/if}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={candidates.length === 1}
                aria-label={m.actic_candidate_remove_position()}
                onclick={() => removeCandidate(ci)}
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>

            <!-- One shared box, tinted like the other fields and aligned with
                 the position input, via the shared RowsBox: dividing lines, a
                 free (empty) row at the end that grows as it is typed in and
                 disappears again once left empty and unfocused. -->
            <RowsBox
              ids={candidate.nominees.map((n) => n.id)}
              group={`nom-${candidate.id}`}
              type="nominee"
              isFilled={(id) =>
                !!candidate.nominees.find((n) => n.id === id)?.name.trim()}
              addRow={(afterId) => addNomineeRow(candidate.id, afterId)}
              removeRow={(id) => removeNomineeRow(candidate.id, id)}
              canDrag={(id) =>
                !!candidate.nominees.find((n) => n.id === id)?.name.trim()}
              class="ml-6"
              onreorder={(sourceId, slot) =>
                reorderNominee(candidate.id, sourceId, slot)}
            >
              {#snippet children({ handle: nomineeHandle, isDragging, index: ni, helpers })}
                {@const nominee = candidate.nominees[ni]!}
                <div
                  class={`flex items-stretch gap-1.5 pl-1 ${isDragging
                    ? `${FIELD_BG} border-border rounded-md border shadow-md`
                    : `border-border ${ni > 0 ? "border-t" : ""}`}`}
                >
                  {#if nominee.name.trim()}
                    <!-- The whole left side is grabbable. -->
                    <span
                      use:attachAction={nomineeHandle}
                      class="text-muted-foreground flex cursor-grab items-center"
                      role="button"
                      tabindex="0"
                      aria-label={m.actic_author_drag()}
                    >
                      <GripVertical class="h-4 w-4" />
                    </span>
                  {:else}
                    <!-- The free row: no drag, nothing to remove. -->
                    <span
                      class="text-muted-foreground flex items-center opacity-30"
                      aria-hidden="true"
                    >
                      <GripVertical class="h-4 w-4" />
                    </span>
                  {/if}
                  <div
                    class="min-w-0 flex-1"
                    use:helpers.trackInput={nominee.id}
                  >
                    <MemberNameInput
                      bind:value={nominee.name}
                      unstyled
                      placeholder={m.actic_candidate_nominee_placeholder()}
                      oninput={helpers.oninput}
                      onenter={helpers.onenter}
                      onescape={helpers.onescape}
                      onblur={helpers.onblur}
                    />
                  </div>
                  {#if nominee.name.trim()}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="self-center"
                      aria-label={m.actic_candidate_remove_nominee()}
                      onclick={() => removeNominee(ci, ni)}
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  {:else}
                    <span
                      class="flex items-center opacity-0"
                      aria-hidden="true"
                    >
                      <X class="h-4 w-4" />
                    </span>
                  {/if}
                </div>
              {/snippet}
            </RowsBox>
          </div>
        {/snippet}
      </SortableItem>
    {/each}
  </DragDropProvider>

  <button
    type="button"
    class="border-border text-muted-foreground hover:border-foreground hover:text-foreground flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-sm"
    onclick={addCandidate}
  >
    <Plus class="h-4 w-4" />
    {m.actic_candidate_add_position()}
  </button>

  <div class="flex flex-col gap-1">
    <label class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        bind:checked={statsEnabled}
        class="accent-primary"
      />
      {m.actic_stats_toggle()}
    </label>
    <p class="text-muted-foreground text-xs">{m.actic_stats_description()}</p>
  </div>
</div>
