import {
  getDocumentType,
  type AuthorInput,
  type DocumentTypeId,
  type FamilyId,
  type KeyedValue,
  type MandateValue,
} from "./dsek";

/** A nominee row inside a draft's candidate group. */
export type DraftNominee = { id: string; name: string };

/** A position group inside a draft's candidates. */
export type DraftCandidate = {
  id: string;
  position?: KeyedValue;
  nominees: DraftNominee[];
  stat: string;
};

export type DraftMandate = MandateValue;

/**
 * A saved draft. Flat and family-tagged: the deliberation fields are always
 * present, and the other families' fields are optional. Signature images are
 * persisted as data URLs.
 */
export type WriteDraft = {
  kind: "write";
  id: string;
  updatedAt: number;
  family: FamilyId;
  type: DocumentTypeId;
  title: string;
  meeting: string;
  authors: AuthorInput[];
  lang: "sv" | "en";
  /** Absent means "today" (the date follows the current day when reopened). */
  dateIso?: string;
  body: string;
  leadIn: string;
  yrkanden: Array<{ clause: string; description: string }>;
  // --- family-specific (optional) ---
  committee?: KeyedValue;
  /** The plan year (equal treatment plans). */
  year?: number;
  position?: KeyedValue;
  requirements?: string[];
  merits?: string[];
  mandate?: DraftMandate;
  candidates?: DraftCandidate[];
  statsEnabled?: boolean;
  /** The header's document-type label (plain documents). */
  docType?: string;
  useCoverPage?: boolean;
  signatures?: Array<{ path: string; dataUrl: string }>;
};

/** A saved draft of an edited governing document's Typst source. */
export type DiffDraft = {
  kind: "diff";
  id: string;
  updatedAt: number;
  slug: string;
  title: string;
  source: string;
};

export type Draft = WriteDraft | DiffDraft;

type StoredDraft = Partial<WriteDraft> & Partial<DiffDraft>;

const KEY = "actic.drafts";
const MAX = 50;

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

/** The calendar date a timestamp fell on, in the browser's timezone. */
function localDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Back-fill a stored draft to the current shape. Drafts saved before families
 * existed have no `family`, so they are treated as deliberations.
 */
function normalizeDraft(raw: StoredDraft): Draft {
  if (raw.kind === "diff") {
    return {
      kind: "diff",
      id: raw.id ?? crypto.randomUUID(),
      updatedAt: raw.updatedAt ?? Date.now(),
      slug: raw.slug ?? "",
      title: raw.title ?? "",
      source: raw.source ?? "",
    };
  }
  const type = raw.type ?? "motion";
  return {
    kind: "write",
    id: raw.id ?? crypto.randomUUID(),
    updatedAt: raw.updatedAt ?? Date.now(),
    family: raw.family ?? getDocumentType(type).family,
    type,
    title: raw.title ?? "",
    meeting: raw.meeting ?? "",
    authors: raw.authors ?? [],
    lang: raw.lang ?? "sv",
    // Older drafts stored "today" as a literal date. If it matches the day
    // the draft was saved, treat it as "today" so it follows the current day
    // when reopened; anything else was a deliberate choice and is kept.
    dateIso:
      raw.dateIso && raw.dateIso !== localDate(raw.updatedAt ?? 0)
        ? raw.dateIso
        : undefined,
    body: raw.body ?? "",
    leadIn: raw.leadIn ?? "",
    yrkanden: raw.yrkanden ?? [],
    committee: raw.committee,
    year: raw.year,
    position: raw.position,
    requirements: raw.requirements ?? [],
    merits: raw.merits ?? [],
    mandate: raw.mandate ?? { mode: "year", year: new Date().getFullYear() },
    candidates: raw.candidates ?? [],
    statsEnabled: raw.statsEnabled ?? false,
    docType: raw.docType ?? "",
    useCoverPage: raw.useCoverPage ?? false,
    signatures: raw.signatures,
  };
}

export function listDrafts(): Draft[] {
  if (!hasStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? (parsed as StoredDraft[]).map(normalizeDraft)
      : [];
  } catch {
    return [];
  }
}

export function getDraft(id: string): Draft | undefined {
  return listDrafts().find((draft) => draft.id === id);
}

/** Persists the draft; false when storage is unavailable or full. */
export function saveDraft(draft: Draft): boolean {
  if (!hasStorage()) return false;
  const rest = listDrafts().filter((d) => d.id !== draft.id);
  try {
    localStorage.setItem(KEY, JSON.stringify([draft, ...rest].slice(0, MAX)));
    return true;
  } catch {
    return false;
  }
}

export function deleteDraft(id: string): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(listDrafts().filter((draft) => draft.id !== id)),
    );
  } catch {
    // Nothing to do — the draft stays in the list.
  }
}
