import type {
  Article,
  Member,
  Event,
  Song,
  Position,
  Committee,
} from "@prisma/client";

export const availableSearchIndexes = [
  "members",
  "events",
  "articles",
  "positions",
  "songs",
] as const;

export type SearchableIndex = (typeof availableSearchIndexes)[number];

export interface SearchableMemberAttributes
  extends Pick<Member, "firstName" | "lastName" | "nickname" | "studentId"> {
  fullName: string;
  id: string;
}
const memberSearchableAttributes: Required<SearchableMemberAttributes> = {
  firstName: "",
  lastName: "",
  nickname: "",
  studentId: "",
  fullName: "",
  id: "",
};
export const memberSearchableAttributesArray = Object.keys(
  memberSearchableAttributes,
) as Array<keyof SearchableMemberAttributes>;

export type SearchableEventAttributes = Pick<
  Event,
  "title" | "titleEn" | "description" | "descriptionEn"
>;
const eventSearchableAttributes: Required<SearchableEventAttributes> = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
};
export const eventSearchableAttributesArray = Object.keys(
  eventSearchableAttributes,
) as Array<keyof SearchableEventAttributes>;

export type SearchableArticleAttributes = Pick<
  Article,
  "header" | "headerEn" | "body" | "bodyEn"
>;
const articleSearchableAttributes: Required<SearchableArticleAttributes> = {
  header: "",
  headerEn: "",
  body: "",
  bodyEn: "",
};
export const articleSearchableAttributesArray = Object.keys(
  articleSearchableAttributes,
) as Array<keyof SearchableArticleAttributes>;

export interface SearchablePositionAttributes
  extends Pick<Position, "name" | "nameEn" | "description" | "descriptionEn"> {
  dsekId: string;
  committeeName: string;
  committeeNameEn: string;
}
const positionSearchableAttributes: Required<SearchablePositionAttributes> = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  committeeName: "",
  committeeNameEn: "",
  dsekId: "",
};
export const positionSearchableAttributesArray = Object.keys(
  positionSearchableAttributes,
) as Array<keyof SearchablePositionAttributes>;

export type SearchableSongAttributes = Pick<
  Song,
  "title" | "lyrics" | "melody" | "category"
>;
const songSearchableAttributes: Required<SearchableSongAttributes> = {
  title: "",
  lyrics: "",
  melody: "",
  category: "",
};
export const songSearchableAttributesArray = Object.keys(
  songSearchableAttributes,
) as Array<keyof SearchableSongAttributes>;

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
