/**
 * The shapes of search results, per index. Search itself (the Meilisearch
 * indexes, their settings and the rebuild) lives in the Go backend's
 * internal/search; it returns `{ type, data }` hits whose `data` is the
 * stored document with long strings cut to 60 characters. Go types `data`
 * as an untyped object, so these describe what each index stores. Unset
 * fields are left out (Go drops nulls). For English, every set `fooEn`
 * field is also exposed as `foo`.
 */

export const availableSearchIndexes = [
  "members",
  "events",
  "articles",
  "positions",
  "songs",
  "committees",
  "governingDocuments",
  "meetingDocuments",
] as const;
export type SearchableIndex = (typeof availableSearchIndexes)[number];

export type MemberSearchReturnAttributes = {
  /** The Meilisearch document id - see searchHelpers' searchDocumentId. */
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  studentId?: string;
  picturePath?: string;
  classYear?: number;
  classProgramme?: string;
};

export type EventSearchReturnAttributes = {
  titleSv: string;
  titleEn?: string;
  descriptionSv: string;
  descriptionEn?: string;
  slug?: string;
  location?: string;
  startDatetime: string;
  endDatetime: string;
};

export type ArticleSearchReturnAttributes = {
  headerSv: string;
  headerEn?: string;
  bodySv: string;
  bodyEn?: string;
  slug: string;
  publishedAt: string;
  author: {
    firstName?: string;
    lastName?: string;
    nickname?: string;
    picturePath?: string;
  };
};

export type PositionSearchReturnAttributes = {
  dsekId: string;
  nameSv: string;
  nameEn?: string;
  descriptionSv?: string;
  descriptionEn?: string;
  committeeNameSv: string;
  committeeNameEn: string;
  committee?: {
    id: string;
    shortName?: string;
    nameSv: string;
    nameEn?: string;
    darkImageUrl?: string;
    lightImageUrl?: string;
    monoImageUrl?: string;
  };
};

export type CommitteeSearchReturnAttributes = {
  shortName?: string;
  nameSv: string;
  nameEn?: string;
  descriptionSv?: string;
  descriptionEn?: string;
  darkImageUrl?: string;
  lightImageUrl?: string;
  monoImageUrl?: string;
};

export type SongSearchReturnAttributes = {
  title: string;
  lyrics: string;
  melody?: string;
  category?: string;
  slug: string;
};

export type GoverningDocumentSearchReturnAttributes = {
  title: string;
  content: string;
  url: string;
};

export type MeetingDocumentSearchReturnAttributes = {
  title: string;
  content: string;
  url: string;
};

export type AnySearchReturnAttributes =
  | SongSearchReturnAttributes
  | ArticleSearchReturnAttributes
  | EventSearchReturnAttributes
  | MemberSearchReturnAttributes
  | PositionSearchReturnAttributes
  | CommitteeSearchReturnAttributes
  | GoverningDocumentSearchReturnAttributes
  | MeetingDocumentSearchReturnAttributes;

export type SearchDataWithType =
  | { type: "members"; data: MemberSearchReturnAttributes }
  | { type: "events"; data: EventSearchReturnAttributes }
  | { type: "articles"; data: ArticleSearchReturnAttributes }
  | { type: "songs"; data: SongSearchReturnAttributes }
  | { type: "positions"; data: PositionSearchReturnAttributes }
  | { type: "committees"; data: CommitteeSearchReturnAttributes }
  | {
      type: "governingDocuments";
      data: GoverningDocumentSearchReturnAttributes;
    }
  | { type: "meetingDocuments"; data: MeetingDocumentSearchReturnAttributes };
