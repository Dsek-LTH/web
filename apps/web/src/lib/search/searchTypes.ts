import type { components } from "$lib/api/schema";

/**
 * The shapes of search results, per index - generated from the Go backend's
 * internal/search (hits.go). A hit is `{ type, data }`, where `type` names
 * the index and `data` is the stored document with long strings cut to 60
 * characters. Unset fields are left out. For English, every set `fooEn`
 * field is also exposed as `foo`.
 */
type Schemas = components["schemas"];

export type SearchableIndex = Schemas["SearchIndex"];

export const availableSearchIndexes = [
  "members",
  "events",
  "articles",
  "positions",
  "songs",
  "committees",
  "governingDocuments",
  "meetingDocuments",
] as const satisfies readonly SearchableIndex[];

export type MemberSearchReturnAttributes = Schemas["MemberSearchDocument"];
export type EventSearchReturnAttributes = Schemas["EventSearchDocument"];
export type ArticleSearchReturnAttributes = Schemas["ArticleSearchDocument"];
export type PositionSearchReturnAttributes = Schemas["PositionSearchDocument"];
export type CommitteeSearchReturnAttributes =
  Schemas["CommitteeSearchDocument"];
export type SongSearchReturnAttributes = Schemas["SongSearchDocument"];
export type GoverningDocumentSearchReturnAttributes =
  Schemas["GoverningDocumentSearchDocument"];
export type MeetingDocumentSearchReturnAttributes =
  Schemas["MeetingDocumentSearchDocument"];

export type SearchDataWithType = Schemas["SearchHit"];
