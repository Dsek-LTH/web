/**
 * The shapes of search results, per index. Search itself (the Meilisearch
 * indexes, their settings and the rebuild) lives in the Go backend's
 * internal/search; it returns `{ type, data }` hits whose `data` is the
 * stored document with long strings cut to 60 characters. Go types `data`
 * as an untyped object, so these describe what each index stores. For
 * English, every `fooEn` field is also exposed as `foo`.
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
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  studentId: string | null;
  picturePath: string | null;
  classYear: number | null;
  classProgramme: string | null;
};

export type EventSearchReturnAttributes = {
  titleSv: string;
  titleEn: string | null;
  descriptionSv: string;
  descriptionEn: string | null;
  slug: string | null;
  location: string | null;
  startDatetime: string;
  endDatetime: string;
};

export type ArticleSearchReturnAttributes = {
  headerSv: string;
  headerEn: string | null;
  bodySv: string;
  bodyEn: string | null;
  slug: string;
  publishedAt: string;
  author: {
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    picturePath: string | null;
  };
};

export type PositionSearchReturnAttributes = {
  dsekId: string;
  nameSv: string;
  nameEn: string | null;
  descriptionSv: string | null;
  descriptionEn: string | null;
  committeeNameSv: string;
  committeeNameEn: string;
  committee: {
    id: string;
    shortName: string | null;
    nameSv: string;
    nameEn: string | null;
    darkImageUrl: string | null;
    lightImageUrl: string | null;
    monoImageUrl: string | null;
  } | null;
};

export type CommitteeSearchReturnAttributes = {
  shortName: string | null;
  nameSv: string;
  nameEn: string | null;
  descriptionSv: string | null;
  descriptionEn: string | null;
  darkImageUrl: string | null;
  lightImageUrl: string | null;
  monoImageUrl: string | null;
};

export type SongSearchReturnAttributes = {
  title: string;
  lyrics: string;
  melody: string | null;
  category: string | null;
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
