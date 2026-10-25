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
export type Draft = {
  id: string;
  updatedAt: number;
  family: FamilyId;
  type: DocumentTypeId;
  title: string;
  meeting: string;
  authors: AuthorInput[];
  lang: "sv" | "en";
  dateIso: string;
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
  signatures?: Array<{ path: string; dataUrl: string }>;
};

const KEY = "actic.drafts";
const MAX = 50;

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Back-fill a stored draft to the current shape. Drafts saved before families
 * existed have no `family`, so they are treated as deliberations.
 */
function normalizeDraft(raw: Partial<Draft>): Draft {
  const type = raw.type ?? "motion";
  return {
    id: raw.id ?? crypto.randomUUID(),
    updatedAt: raw.updatedAt ?? Date.now(),
    family: raw.family ?? getDocumentType(type).family,
    type,
    title: raw.title ?? "",
    meeting: raw.meeting ?? "",
    authors: raw.authors ?? [],
    lang: raw.lang ?? "sv",
    dateIso: raw.dateIso ?? todayIso(),
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
    signatures: raw.signatures,
  };
}

export function listDrafts(): Draft[] {
  if (!hasStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? (parsed as Array<Partial<Draft>>).map(normalizeDraft)
      : [];
  } catch {
    return [];
  }
}

export function getDraft(id: string): Draft | undefined {
  return listDrafts().find((draft) => draft.id === id);
}

export function saveDraft(draft: Draft): void {
  if (!hasStorage()) return;
  const rest = listDrafts().filter((d) => d.id !== draft.id);
  localStorage.setItem(KEY, JSON.stringify([draft, ...rest].slice(0, MAX)));
}

export function deleteDraft(id: string): void {
  if (!hasStorage()) return;
  localStorage.setItem(
    KEY,
    JSON.stringify(listDrafts().filter((draft) => draft.id !== id)),
  );
}
