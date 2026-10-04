import type { AuthorInput, DocumentTypeId } from "./dsek";

/** A saved draft. Signature images are deliberately not persisted. */
export type Draft = {
  id: string;
  updatedAt: number;
  type: DocumentTypeId;
  title: string;
  meeting: string;
  authors: AuthorInput[];
  lang: "sv" | "en";
  dateIso: string;
  body: string;
  leadIn: string;
  yrkanden: Array<{ clause: string; description: string }>;
};

const KEY = "actic.drafts";
const MAX = 50;

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function listDrafts(): Draft[] {
  if (!hasStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Draft[]) : [];
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
    JSON.stringify(listDrafts().filter((d) => d.id !== id)),
  );
}
