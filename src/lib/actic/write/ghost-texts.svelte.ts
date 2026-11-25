import * as m from "$paraglide/messages";
import type { DocumentInput } from "$lib/actic/documents/dsek";

/**
 * Ghost texts: the example texts empty placeholders rotate among. Numbered
 * keys (_1.._n) form a pool the field's ghosts vary among; unnumbered keys
 * are single, fixed ghosts — the old way, like every other translation.
 */
type Locale = "sv" | "en";

/** Title ghost texts, per family. */
export function titleGhosts(
  family: DocumentInput["family"],
  locale: Locale,
): string[] {
  switch (family) {
    case "deliberation":
    case "plain-document":
      return [
        m.actic_field_title_placeholder_1({}, { locale }),
        m.actic_field_title_placeholder_2({}, { locale }),
        m.actic_field_title_placeholder_3({}, { locale }),
      ];
    default:
      return [];
  }
}

/** Body ghost texts, per family. */
export function bodyGhosts(
  family: DocumentInput["family"],
  locale: Locale,
): string[] {
  switch (family) {
    // The generic pool, including #3.
    case "deliberation":
    case "plain-document":
      return [
        m.actic_body_placeholder_1({}, { locale }),
        m.actic_body_placeholder_2({}, { locale }),
        m.actic_body_placeholder_3({}, { locale }),
      ];
    // The generic pool minus #3.
    case "plan-of-operations":
      return [
        m.actic_body_placeholder_1({}, { locale }),
        m.actic_body_placeholder_2({}, { locale }),
      ];
    case "equal-treatment-plan":
      // Unnumbered: one fixed ghost.
      return [m.actic_etp_body_placeholder({}, { locale })];
    case "nomination":
      return [
        m.actic_nom_body_placeholder_1({}, { locale }),
        m.actic_nom_body_placeholder_2({}, { locale }),
      ];
    default:
      return [];
  }
}

/** Clause (att-sats) ghost texts, per family. */
export function clauseGhosts(
  family: DocumentInput["family"],
  locale: Locale,
): string[] {
  switch (family) {
    case "deliberation":
      return [
        m.actic_yrkanden_clause_placeholder_1({}, { locale }),
        m.actic_yrkanden_clause_placeholder_2({}, { locale }),
        m.actic_yrkanden_clause_placeholder_3({}, { locale }),
        m.actic_yrkanden_clause_placeholder_4({}, { locale }),
        m.actic_yrkanden_clause_placeholder_5({}, { locale }),
      ];
    case "nomination":
      // Unnumbered: one fixed ghost for every row.
      return [m.actic_nom_clause_placeholder({}, { locale })];
    default:
      return [];
  }
}

/**
 * A dealer hands each ghost in the pool out once before any repeats: every
 * new row takes the next ticket from a shuffled deck, and a row keeps its
 * ghost for as long as it lives (so nothing flickers while typing).
 */
export function ghostDealer(pool: string[]): (rowId: string) => string {
  let deck: string[] = [];
  // Deliberately NOT a SvelteMap: the deal runs inside template expressions
  // (the row placeholders), and writing reactive state during a render is
  // forbidden (`state_unsafe_mutation`). This memo must stay inert — a plain
  // record, which also keeps `svelte/prefer-svelte-reactivity` happy.
  const dealt: Record<string, string> = {};
  return (rowId: string) => {
    const existing = dealt[rowId];
    if (existing !== undefined) return existing;
    if (deck.length === 0) {
      deck = [...pool];
      // Fisher–Yates, in place.
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j]!, deck[i]!];
      }
    }
    const ghost = deck.shift()!;
    dealt[rowId] = ghost;
    return ghost;
  };
}

/** Doc-type ghost texts (plain document's free-form type field), per family. */
export function docTypeGhosts(
  family: DocumentInput["family"],
  locale: Locale,
): string[] {
  switch (family) {
    case "plain-document":
      return [
        m.actic_field_docType_placeholder_1({}, { locale }),
        m.actic_field_docType_placeholder_2({}, { locale }),
        m.actic_field_docType_placeholder_3({}, { locale }),
      ];
    default:
      return [];
  }
}

/** Ghost texts for the requirements and merits rows, dealt per row. */
export function reqsMeritsGhosts(locale: Locale): string[] {
  return [
    m.actic_reqs_merits_placeholder_1({}, { locale }),
    m.actic_reqs_merits_placeholder_2({}, { locale }),
    m.actic_reqs_merits_placeholder_3({}, { locale }),
    m.actic_reqs_merits_placeholder_4({}, { locale }),
    m.actic_reqs_merits_placeholder_5({}, { locale }),
    m.actic_reqs_merits_placeholder_6({}, { locale }),
    m.actic_reqs_merits_placeholder_7({}, { locale }),
    m.actic_reqs_merits_placeholder_8({}, { locale }),
  ];
}

/**
 * A deal function that survives pool identity changes: only a change in the
 * pool's CONTENT (re)builds the dealer. Callers re-render with new arrays
 * all the time; the ghosts must not move because of it. Reactive (`.svelte.ts`).
 */
export function contentKeyedDealer(
  pool: () => string[],
): (rowId: string) => string {
  let key: string | null = null;
  let dealer: ((rowId: string) => string) | undefined;
  const deal = $derived.by(() => {
    const next = pool();
    const nextKey = next.join("\u0000");
    if (nextKey !== key) {
      key = nextKey;
      dealer = ghostDealer(next);
    }
    return dealer!;
  });
  return (rowId) => deal(rowId);
}

/** A random pick for a visit-level ghost (title, body) — client-side only. */
export function randomGhost<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}
