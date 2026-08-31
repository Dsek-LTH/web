/**
 * This file contains a lot of types and constants.
 *
 * Essentially, for every index in Meilisearch there is a type for:
 *  1. which attributes are stored in Meilisearch for that index,
 *  2. which attributes a user can search for,
 *  3. which attributes are returned.
 *
 * Of course, all attributes that can be searched for, or are returned,
 * must be stored in Meilisearch. However, it is not as simple as doing
 * a union of 2 and 3 to get 1, since some attributes (e.g `event.startDatetime`)
 * are used purely for sorting and ranking purposes internally by Meilisearch.
 *
 * Additionally, there are objects like `memberMeilisearchConstants` which
 * wraps things related to an index in a single object. Here we can specify
 * custom ranking and sorting rules for Meili, such as giving newer members
 * a higher ranking, and tweak which typo tolerance is allowed.
 */

import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

/**
 * Utility type that creates a new object type based on a union of keys (Keys).
 *
 * For each key in Keys:
 *   - If the key exists in T, its value type is preserved from T.
 *   - If the key does not exist in T, its value type is set to `string`.
 *
 * This is useful for creating a new type that includes specific keys (from Keys),
 * ensuring compatibility with an existing type (T), while accounting for missing keys.
 */
type FilterKeys<T extends Record<string, unknown>, Keys extends string> = {
  [Key in Keys]: Key extends keyof T ? T[Key] : string;
};

/**
 * Utility type that filters out keys from T that end with Suffix.
 * Useful for excluding specific keys from an existing type.
 * Used to exclude language specific fields from search attributes.
 */
type ObjectKeysNotEndingWith<T, Suffix extends string> = Pick<
  T,
  {
    [K in keyof T]: K extends `${string}${Suffix}` ? never : K;
  }[keyof T]
>;

type OnlySwedishAttributes<T> = ObjectKeysNotEndingWith<T, "En">;

/**
 * https://www.totaltypescript.com/concepts/the-prettify-helper
 */
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

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

// --------------------------------------------------
// MEMBER
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const memberSearchableAttributes = [
  "fullName",
  "firstName",
  "lastName",
  "nickname",
  "studentId",
] as const satisfies Array<keyof MemberDataInMeilisearch>;
export type SearchableMemberAttributes = FilterKeys<
  ExtendedPrismaModel<"Member">,
  (typeof memberSearchableAttributes)[number]
>;
export type MemberDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Member">,
    | "firstName"
    | "lastName"
    | "nickname"
    | "studentId"
    | "classYear"
    | "classProgramme"
    | "picturePath"
  > & {
    fullName: `${ExtendedPrismaModel<"Member">["firstName"]} ${ExtendedPrismaModel<"Member">["lastName"]}`;
  }
>;
export type MemberSearchReturnAttributes = OnlySwedishAttributes<
  SearchableMemberAttributes &
    Pick<
      MemberDataInMeilisearch,
      "picturePath" | "classYear" | "classProgramme"
    >
>;

// --------------------------------------------------
// EVENT
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const eventSearchableAttributes = [
  "titleSv",
  "titleEn",
  "descriptionSv",
  "descriptionEn",
] as const satisfies Array<keyof EventDataInMeilisearch>;
export type SearchableEventAttributes = Pick<
  ExtendedPrismaModel<"Event">,
  (typeof eventSearchableAttributes)[number]
>;
export type EventDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Event"> & ExtendedPrismaModel<"RecurringEvent">,
    | "titleSv"
    | "titleEn"
    | "slug"
    | "startDatetime"
    | "endDatetime"
    | "location"
    | "descriptionEn"
    | "descriptionSv"
  >
>;
export type EventSearchReturnAttributes = SearchableEventAttributes &
  Pick<
    EventDataInMeilisearch,
    "slug" | "location" | "startDatetime" | "endDatetime"
  >;

// --------------------------------------------------
// ARTICLE
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const articleSearchableAttributes = [
  "headerSv",
  "headerEn",
  "bodySv",
  "bodyEn",
] as const satisfies Array<keyof ArticleDataInMeilisearch>;
export type SearchableArticleAttributes = Pick<
  ExtendedPrismaModel<"Article">,
  (typeof articleSearchableAttributes)[number]
>;
export type ArticleDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Article"> & ExtendedPrismaModel<"Member">,
    "headerSv" | "headerEn" | "bodySv" | "bodyEn" | "slug" | "publishedAt"
  > & {
    author: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "lastName" | "nickname" | "picturePath"
    >;
  }
>;
export type ArticleSearchReturnAttributes = SearchableArticleAttributes &
  Pick<ArticleDataInMeilisearch, "slug" | "publishedAt" | "author">;

// --------------------------------------------------
// POSITION
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const positionSearchableAttributes = [
  "nameSv",
  "nameEn",
  "descriptionSv",
  "descriptionEn",
  "committeeNameSv",
  "committeeNameEn",
  "dsekId",
] as const satisfies Array<keyof PositionDataInMeilisearch>;
export type SearchablePositionAttributes = FilterKeys<
  ExtendedPrismaModel<"Position">,
  (typeof positionSearchableAttributes)[number]
>;
export type PositionDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Position">,
    "nameSv" | "nameEn" | "descriptionSv" | "descriptionEn"
  > & {
    committee: Omit<
      ExtendedPrismaModel<"Committee">,
      "name" | "description"
    > | null;
    dsekId: string;
    committeeNameSv: ExtendedPrismaModel<"Committee">["nameSv"];
    committeeNameEn: ExtendedPrismaModel<"Committee">["nameEn"];
  }
>;
export type PositionSearchReturnAttributes = SearchablePositionAttributes &
  Pick<PositionDataInMeilisearch, "committee" | "dsekId">;

// --------------------------------------------------
// COMMITTEE
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const committeeSearchableAttributes = [
  "nameSv",
  "nameEn",
  "descriptionSv",
  "descriptionEn",
] as const satisfies Array<keyof CommitteeDataInMeilisearch>;
export type SearchableCommitteeAttributes = Pick<
  ExtendedPrismaModel<"Committee">,
  (typeof committeeSearchableAttributes)[number]
>;
export type CommitteeDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Committee">,
    | "nameSv"
    | "nameEn"
    | "descriptionSv"
    | "descriptionEn"
    | "shortName"
    | "darkImageUrl"
    | "lightImageUrl"
    | "monoImageUrl"
  >
>;
export type CommitteeSearchReturnAttributes = SearchableCommitteeAttributes &
  Pick<
    CommitteeDataInMeilisearch,
    "shortName" | "darkImageUrl" | "lightImageUrl" | "monoImageUrl"
  >;

// --------------------------------------------------
// SONG
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const songSearchableAttributes = [
  "title",
  "lyrics",
  "melody",
  "category",
] as const satisfies Array<keyof SongDataInMeilisearch>;
export type SearchableSongAttributes = Pick<
  ExtendedPrismaModel<"Song">,
  (typeof songSearchableAttributes)[number]
>;
export type SongDataInMeilisearch = Prettify<
  Pick<
    ExtendedPrismaModel<"Song">,
    "title" | "lyrics" | "melody" | "category" | "slug"
  >
>;
export type SongSearchReturnAttributes = OnlySwedishAttributes<
  SearchableSongAttributes & Pick<SongDataInMeilisearch, "slug">
>;

// --------------------------------------------------
// GOVERNING DOCUMENT
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const governingDocumentSearchableAttributes = [
  "title",
  "content",
] as const satisfies Array<keyof GoverningDocumentDataInMeilisearch>;
export type SearchableGoverningDocumentAttributes = Pick<
  GoverningDocumentDataInMeilisearch,
  (typeof governingDocumentSearchableAttributes)[number]
>;
export type GoverningDocumentDataInMeilisearch = Prettify<
  Pick<ExtendedPrismaModel<"Document">, "id" | "title" | "url" | "type"> & {
    content: string;
  }
>;
export type GoverningDocumentSearchReturnAttributes =
  SearchableGoverningDocumentAttributes &
    Pick<GoverningDocumentDataInMeilisearch, "url">;

// --------------------------------------------------
// MEETING DOCUMENT
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const meetingDocumentSearchableAttributes = [
  "title",
  "content",
] as const satisfies Array<keyof MeetingDocumentDataInMeilisearch>;
export type SearchableMeetingDocumentAttributes = Pick<
  MeetingDocumentDataInMeilisearch,
  (typeof meetingDocumentSearchableAttributes)[number]
>;
export type MeetingDocumentDataInMeilisearch = Prettify<{
  id: string;
  title?: string;
  url: string;
  content: string;
}>;
export type MeetingDocumentSearchReturnAttributes =
  SearchableMeetingDocumentAttributes &
    Pick<MeetingDocumentDataInMeilisearch, "url">;

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
  | {
      type: "members";
      data: MemberSearchReturnAttributes;
    }
  | {
      type: "events";
      data: EventSearchReturnAttributes;
    }
  | {
      type: "articles";
      data: ArticleSearchReturnAttributes;
    }
  | {
      type: "songs";
      data: SongSearchReturnAttributes;
    }
  | {
      type: "positions";
      data: PositionSearchReturnAttributes;
    }
  | {
      type: "committees";
      data: CommitteeSearchReturnAttributes;
    }
  | {
      type: "governingDocuments";
      data: GoverningDocumentSearchReturnAttributes;
    }
  | {
      type: "meetingDocuments";
      data: MeetingDocumentSearchReturnAttributes;
    };

/**
 * The server slices strings before sending them to the client
 * to reduce traffic. Some attributes cannot be sliced however,
 * since they are used to link to the entry, or e.g. as a image
 */
export const attributesUsedAsLink = {
  members: ["studentId", "picturePath"],
  events: ["slug"],
  articles: ["slug"],
  songs: ["slug"],
  positions: ["dsekId"],
  committees: ["shortName", "darkImageUrl", "lightImageUrl", "monoImageUrl"],
  governingDocuments: ["url"],
  meetingDocuments: ["url"],
} as const satisfies {
  members: Array<keyof MemberSearchReturnAttributes>;
  events: Array<keyof EventSearchReturnAttributes>;
  articles: Array<keyof ArticleSearchReturnAttributes>;
  songs: Array<keyof SongSearchReturnAttributes>;
  positions: Array<keyof PositionSearchReturnAttributes>;
  committees: Array<keyof CommitteeSearchReturnAttributes>;
  governingDocuments: Array<keyof GoverningDocumentSearchReturnAttributes>;
  meetingDocuments: Array<keyof MeetingDocumentSearchReturnAttributes>;
};

export const listOfAttributesUsedAsLink: string[] =
  Object.values(attributesUsedAsLink).flat();

type DefaultRankingRules =
  | "words"
  | "typo"
  | "proximity"
  | "attribute"
  | "exactness";
const defaultRankingRules = [
  "words",
  "typo",
  "proximity",
  "attribute",
  "exactness",
] as const satisfies DefaultRankingRules[];

/**
 * Constants for Meilisearch indexes. These are used when tweaking the search
 * or when getting e.g. the searchable attributes for a specific index.
 * This interface is used to ensure that the constants are correctly typed.
 * This may need to be updated if the Meilisearch package changes its namings/APIs.
 */
interface IndexConstantsMeilisearch<Searchable, DataInMeilisearch> {
  searchableAttributes: Array<keyof Searchable>;
  rankingRules: Array<
    | DefaultRankingRules
    | `${Extract<keyof DataInMeilisearch, string>}:${"asc" | "desc"}`
  >;
  sortableAttributes?: Array<keyof DataInMeilisearch>;
  typoTolerance?: {
    disableOnAttributes: Array<keyof Searchable>;
    minWordSizeForTypos: {
      oneTypo: number;
      twoTypos: number;
    };
  };
}

type MemberConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<SearchableMemberAttributes, MemberDataInMeilisearch>
>;
type ArticleConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<
    SearchableArticleAttributes,
    ArticleDataInMeilisearch
  >
>;
type EventConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<SearchableEventAttributes, EventDataInMeilisearch>
>;
type PositionConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<
    SearchablePositionAttributes,
    PositionDataInMeilisearch
  >
>;
type CommitteeConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<
    SearchableCommitteeAttributes,
    CommitteeDataInMeilisearch
  >
>;
type SongConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<SearchableSongAttributes, SongDataInMeilisearch>
>;
type GoverningDocumentConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<
    SearchableGoverningDocumentAttributes,
    GoverningDocumentDataInMeilisearch
  >
>;
type MeetingDocumentConstantsMeilisearch = Prettify<
  IndexConstantsMeilisearch<
    SearchableMeetingDocumentAttributes,
    MeetingDocumentDataInMeilisearch
  >
>;

const memberMeilisearchConstants: MemberConstantsMeilisearch = {
  searchableAttributes: memberSearchableAttributes,
  rankingRules: [
    ...defaultRankingRules,
    "classYear:desc", // Give a higher weight to newer members
  ],
  sortableAttributes: ["classYear"],
  typoTolerance: {
    disableOnAttributes: ["studentId"], // Student ID should not have typos
    minWordSizeForTypos: {
      // Default is 5 for one, and 9 for two
      // A query like "Maja" should still match "Maya", and "Erik" should match "Eric"
      oneTypo: 4,
      twoTypos: 6,
    },
  },
};

const articleMeilisearchConstants: ArticleConstantsMeilisearch = {
  searchableAttributes: articleSearchableAttributes,
  rankingRules: defaultRankingRules,
  sortableAttributes: ["publishedAt"],
};

const eventMeilisearchConstants: EventConstantsMeilisearch = {
  searchableAttributes: eventSearchableAttributes,
  rankingRules: [
    ...defaultRankingRules,
    "startDatetime:desc", // Give a higher weight to newer events
  ],
  sortableAttributes: ["startDatetime"],
};

const positionMeilisearchConstants: PositionConstantsMeilisearch = {
  searchableAttributes: positionSearchableAttributes,
  rankingRules: defaultRankingRules,
};

const committeeMeilisearchConstants: CommitteeConstantsMeilisearch = {
  searchableAttributes: committeeSearchableAttributes,
  rankingRules: defaultRankingRules,
};

const songMeilisearchConstants: SongConstantsMeilisearch = {
  searchableAttributes: songSearchableAttributes,
  rankingRules: defaultRankingRules,
};

const governingDocumentMeilisearchConstants: GoverningDocumentConstantsMeilisearch =
  {
    searchableAttributes: governingDocumentSearchableAttributes,
    rankingRules: defaultRankingRules,
  };

const meetingDocumentMeilisearchConstants: MeetingDocumentConstantsMeilisearch =
  {
    searchableAttributes: meetingDocumentSearchableAttributes,
    rankingRules: defaultRankingRules,
  };

export const meilisearchConstants = {
  member: memberMeilisearchConstants,
  article: articleMeilisearchConstants,
  event: eventMeilisearchConstants,
  position: positionMeilisearchConstants,
  committee: committeeMeilisearchConstants,
  song: songMeilisearchConstants,
  governingDocument: governingDocumentMeilisearchConstants,
  meetingDocument: meetingDocumentMeilisearchConstants,
};

export type MeilisearchConstants =
  | {
      constants: MemberConstantsMeilisearch;
      data: MemberDataInMeilisearch;
    }
  | {
      constants: ArticleConstantsMeilisearch;
      data: ArticleDataInMeilisearch;
    }
  | {
      constants: EventConstantsMeilisearch;
      data: EventDataInMeilisearch;
    }
  | {
      constants: PositionConstantsMeilisearch;
      data: PositionDataInMeilisearch;
    }
  | {
      constants: CommitteeConstantsMeilisearch;
      data: CommitteeDataInMeilisearch;
    }
  | {
      constants: SongConstantsMeilisearch;
      data: SongDataInMeilisearch;
    }
  | {
      constants: GoverningDocumentConstantsMeilisearch;
      data: GoverningDocumentDataInMeilisearch;
    }
  | {
      constants: MeetingDocumentConstantsMeilisearch;
      data: MeetingDocumentDataInMeilisearch;
    };
