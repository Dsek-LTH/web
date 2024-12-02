import type {
  Article,
  Member,
  Event,
  Song,
  Committee,
  Position,
} from "@prisma/client";

export const availableSearchIndexes = {
  members: "members",
  events: "events",
  articles: "articles",
  positions: "positions",
  songs: "songs",
} as const;

export type SearchMember = Pick<
  Member,
  | "studentId"
  | "firstName"
  | "lastName"
  | "nickname"
  | "picturePath"
  | "classYear"
> & {
  name: string;
  id: string;
};
export type SearchSong = Pick<
  Song,
  "title" | "category" | "lyrics" | "melody" | "slug"
> & {
  id: string;
};
export type SearchArticle = Pick<
  Article,
  "body" | "bodyEn" | "header" | "headerEn" | "slug"
> & {
  id: string;
};
export type SearchEvent = Pick<
  Event,
  "title" | "titleEn" | "description" | "descriptionEn" | "slug"
> & {
  id: string;
};
export type SearchPosition = Pick<
  Position,
  "committeeId" | "description" | "descriptionEn" | "name" | "nameEn"
> & {
  committee: Committee | null;
  id: string;
  dsekId: Position["id"];
};

export type SearchDataWithType =
  | {
      type: "members";
      data: SearchMember;
    }
  | {
      type: "events";
      data: SearchEvent;
    }
  | {
      type: "articles";
      data: SearchArticle;
    }
  | {
      type: "songs";
      data: SearchSong;
    }
  | {
      type: "positions";
      data: SearchPosition;
    };
