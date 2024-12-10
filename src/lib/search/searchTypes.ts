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

export const availableSearchIndexes = [
  "members",
  "events",
  "articles",
  "positions",
  "songs",
] as const;
export type SearchableIndex = (typeof availableSearchIndexes)[number];

export const memberSearchableAttributes = [
  "id",
  "firstName",
  "lastName",
  "nickname",
  "studentId",
  "fullName",
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

export type SongSearchReturnAttributes = SearchableSongAttributes &
  Pick<Song, "slug">;
export type ArticleSearchReturnAttributes = SearchableArticleAttributes &
  Pick<Article, "slug">;
export type EventSearchReturnAttributes = SearchableEventAttributes &
  Pick<Event, "slug">;
export type MemberSearchReturnAttributes = SearchableMemberAttributes & {
  picturePath: string;
  classYear: number;
};
export type PositionSearchReturnAttributes = SearchablePositionAttributes &
  Pick<Position, "committeeId"> & {
    committee: Committee | null;
  };

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
    };
