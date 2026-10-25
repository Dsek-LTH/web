import type { AuthorInput, KeyedValue } from "./dsek";
import { ALL_POSITIONS, COMMITTEE_GROUPS } from "./positions";

/** A reorderable row of plain text (requirements, merits). */
export type TextRow = { id: string; value: string };

/** A reorderable resolution row. */
export type YrkandeRow = { id: string; clause: string; description: string };

/** An author card row. */
export type AuthorRow = AuthorInput & { id: string };

/** A nominee row inside a candidate group. */
export type NomineeRow = { id: string; name: string };

/** A candidate group row: a position with its nominees and optional applicant range. */
export type CandidateRow = {
  id: string;
  position?: KeyedValue;
  nominees: NomineeRow[];
  stat: string;
};

let seq = 0;
/** A client-only unique id for a freshly added row. */
export function nextId(prefix: string): string {
  return `${prefix}-${seq++}-${crypto.randomUUID()}`;
}

/**
 * The display text for a keyed/free-text value. Keys may be a committee group
 * (`km`) or a position path (`styr.ordf`).
 */
export function keyedLabel(value: KeyedValue | undefined, en: boolean): string {
  if (!value) return "";
  if (value.kind === "text") return value.value;
  const committee = COMMITTEE_GROUPS.find((g) => g.key === value.path);
  if (committee) return en ? committee.labelEn : committee.label;
  const position = ALL_POSITIONS.find((p) => p.path === value.path);
  if (position) return en ? position.labelEn : position.label;
  return value.path;
}
