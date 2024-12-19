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

export const availableSearchIndexes = [
  "members",
  "events",
  "articles",
  "positions",
  "songs",
  "committees",
] as const;
export type SearchableIndex = (typeof availableSearchIndexes)[number];

export const memberSearchableAttributes = [
  "fullName",
  "firstName",
  "lastName",
  "nickname",
  "studentId",
] as const satisfies Array<keyof Member | "fullName">;
export type SearchableMemberAttributes = FilterKeys<
  Member,
  (typeof memberSearchableAttributes)[number]
>;

export const eventSearchableAttributes = [
  "title",
  "titleEn",
  "description",
  "descriptionEn",
] as const satisfies Array<keyof Event>;
export type SearchableEventAttributes = Pick<
  Event,
  (typeof eventSearchableAttributes)[number]
>;

export const articleSearchableAttributes = [
  "header",
  "headerEn",
  "body",
  "bodyEn",
] as const satisfies Array<keyof Article>;
export type SearchableArticleAttributes = Pick<
  Article,
  (typeof articleSearchableAttributes)[number]
>;

export const positionSearchableAttributes = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
  "dsekId",
  "committeeName",
  "committeeNameEn",
] as const satisfies Array<
  keyof Position | "dsekId" | "committeeName" | "committeeNameEn"
>;
export type SearchablePositionAttributes = FilterKeys<
  Position,
  (typeof positionSearchableAttributes)[number]
>;

export const songSearchableAttributes = [
  "title",
  "lyrics",
  "melody",
  "category",
] as const satisfies Array<keyof Song>;
export type SearchableSongAttributes = Pick<
  Song,
  (typeof songSearchableAttributes)[number]
>;

export const committeeSearchableAttributes = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
] as const satisfies Array<keyof Committee>;
export type SearchableCommitteeAttributes = Pick<
  Committee,
  (typeof committeeSearchableAttributes)[number]
>;

export type SongSearchReturnAttributes = OnlySwedishAttributes<
  SearchableSongAttributes & Pick<Song, "slug">
>;
export type ArticleSearchReturnAttributes = OnlySwedishAttributes<
  SearchableArticleAttributes & Pick<Article, "slug">
>;
export type EventSearchReturnAttributes = OnlySwedishAttributes<
  SearchableEventAttributes & Pick<Event, "slug">
>;
export type MemberSearchReturnAttributes = OnlySwedishAttributes<
  SearchableMemberAttributes & {
    picturePath: Member["picturePath"];
    classYear: Member["classYear"];
    classProgramme: Member["classProgramme"];
  }
>;
export type PositionSearchReturnAttributes = OnlySwedishAttributes<
  SearchablePositionAttributes &
    Pick<Position, "committeeId"> & {
      committee: Committee | null;
    }
>;
export type CommitteeSearchReturnAttributes = OnlySwedishAttributes<
  SearchableCommitteeAttributes &
    Pick<
      Committee,
      "shortName" | "darkImageUrl" | "lightImageUrl" | "monoImageUrl"
    >
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

export const attributesUsedAsLink: {
  members: keyof MemberSearchReturnAttributes;
  events: keyof EventSearchReturnAttributes;
  articles: keyof ArticleSearchReturnAttributes;
  songs: keyof SongSearchReturnAttributes;
  positions: keyof PositionSearchReturnAttributes;
  committees: keyof CommitteeSearchReturnAttributes;
} = {
  members: "studentId",
  events: "slug",
  articles: "slug",
  songs: "slug",
  positions: "dsekId",
  committees: "shortName",
};

export const listOfattributesUsedAsLink: string[] = Object.values(
  attributesUsedAsLink,
) satisfies string[];
