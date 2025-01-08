/**
 * This file contains a lot of types and constants.
 *
 * Essentially, for every index in Meilisearch there is a type for:
 *  1. which attributes are stored in Meilisearch for that index,
 *  2. which attributes a user can search for,
 *  3. which attributes are returned.
 *
 * Of course, all attributes that can be searched for, or are returned,
 * must be stored in Meilisearch. However, it is not as simble as doing
 * a union of 2 and 3 to get 1, since some attributes (e.g `event.startDatetime`)
 * are used purely for sorting and ranking purposes internally by Meilisearch.
 *
 * Additionally, there are objects like `memberMeilisearchConstants` which
 * wraps things related to an index in a single object. Here we can specify
 * custom ranking and sorting rules for Meili, such as giving newer members
 * a higher ranking, and tweak which typo tolerance is allowed.
 */

import type {
  Article,
  Member,
  Event,
  Song,
  Position,
  Committee,
} from "@prisma/client";

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
  Member,
  (typeof memberSearchableAttributes)[number]
>;
export type MemberDataInMeilisearch = Prettify<
  Pick<
    Member,
    | "firstName"
    | "lastName"
    | "nickname"
    | "studentId"
    | "classYear"
    | "classProgramme"
    | "picturePath"
  > & {
    fullName: `${Member["firstName"]} ${Member["lastName"]}`;
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
  "title",
  "titleEn",
  "description",
  "descriptionEn",
] as const satisfies Array<keyof EventDataInMeilisearch>;
export type SearchableEventAttributes = Pick<
  Event,
  (typeof eventSearchableAttributes)[number]
>;
export type EventDataInMeilisearch = Prettify<
  Pick<
    Event,
    | "title"
    | "titleEn"
    | "description"
    | "descriptionEn"
    | "slug"
    | "startDatetime"
  >
>;
export type EventSearchReturnAttributes = OnlySwedishAttributes<
  SearchableEventAttributes & Pick<EventDataInMeilisearch, "slug">
>;

// --------------------------------------------------
// ARTICLE
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const articleSearchableAttributes = [
  "header",
  "headerEn",
  "body",
  "bodyEn",
] as const satisfies Array<keyof ArticleDataInMeilisearch>;
export type SearchableArticleAttributes = Pick<
  Article,
  (typeof articleSearchableAttributes)[number]
>;
export type ArticleDataInMeilisearch = Pick<
  Article,
  "header" | "headerEn" | "body" | "bodyEn" | "slug" | "publishedAt"
>;
export type ArticleSearchReturnAttributes = OnlySwedishAttributes<
  SearchableArticleAttributes & Pick<ArticleDataInMeilisearch, "slug">
>;

// --------------------------------------------------
// POSITION
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const positionSearchableAttributes = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
  "committeeName",
  "committeeNameEn",
  "dsekId",
] as const satisfies Array<keyof PositionDataInMeilisearch>;
export type SearchablePositionAttributes = FilterKeys<
  Position,
  (typeof positionSearchableAttributes)[number]
>;
export type PositionDataInMeilisearch = Prettify<
  Pick<Position, "name" | "nameEn" | "description" | "descriptionEn"> & {
    committee: Committee | null;
    dsekId: string;
    committeeName: Committee["name"];
    committeeNameEn: Committee["nameEn"];
  }
>;
export type PositionSearchReturnAttributes = OnlySwedishAttributes<
  SearchablePositionAttributes &
    Pick<PositionDataInMeilisearch, "committee" | "dsekId">
>;

// --------------------------------------------------
// COMMITTEE
// --------------------------------------------------

// The order of the attributes in the array is important for ranking
// The lower the index, the higher the weight
export const committeeSearchableAttributes = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
] as const satisfies Array<keyof CommitteeDataInMeilisearch>;
export type SearchableCommitteeAttributes = Pick<
  Committee,
  (typeof committeeSearchableAttributes)[number]
>;
export type CommitteeDataInMeilisearch = Prettify<
  Pick<
    Committee,
    | "name"
    | "nameEn"
    | "description"
    | "descriptionEn"
    | "shortName"
    | "darkImageUrl"
    | "lightImageUrl"
    | "monoImageUrl"
  >
>;
export type CommitteeSearchReturnAttributes = OnlySwedishAttributes<
  SearchableCommitteeAttributes &
    Pick<
      CommitteeDataInMeilisearch,
      "shortName" | "darkImageUrl" | "lightImageUrl" | "monoImageUrl"
    >
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
  Song,
  (typeof songSearchableAttributes)[number]
>;
export type SongDataInMeilisearch = Prettify<
  Pick<Song, "title" | "lyrics" | "melody" | "category" | "slug">
>;
export type SongSearchReturnAttributes = OnlySwedishAttributes<
  SearchableSongAttributes & Pick<SongDataInMeilisearch, "slug">
>;

export type AnySearchReturnAttributes =
  | SongSearchReturnAttributes
  | ArticleSearchReturnAttributes
  | EventSearchReturnAttributes
  | MemberSearchReturnAttributes
  | PositionSearchReturnAttributes
  | CommitteeSearchReturnAttributes;

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
    };

/**
 * The server slices strings before sending them to the client
 * to reduce traffic. Some attributes cannot be sliced however,
 * since they are used to link to the entry, or e.g. as a image
 */
export const attributesUsedAsLink: {
  members: Array<keyof MemberSearchReturnAttributes>;
  events: Array<keyof EventSearchReturnAttributes>;
  articles: Array<keyof ArticleSearchReturnAttributes>;
  songs: Array<keyof SongSearchReturnAttributes>;
  positions: Array<keyof PositionSearchReturnAttributes>;
  committees: Array<keyof CommitteeSearchReturnAttributes>;
} = {
  members: ["studentId", "picturePath"],
  events: ["slug"],
  articles: ["slug"],
  songs: ["slug"],
  positions: ["dsekId"],
  committees: ["shortName", "darkImageUrl", "lightImageUrl", "monoImageUrl"],
};

export const listOfattributesUsedAsLink: string[] =
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

export const meilisearchConstants = {
  member: memberMeilisearchConstants,
  article: articleMeilisearchConstants,
  event: eventMeilisearchConstants,
  position: positionMeilisearchConstants,
  committee: committeeMeilisearchConstants,
  song: songMeilisearchConstants,
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
    };
