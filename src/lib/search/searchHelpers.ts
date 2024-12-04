import type { AvailableLanguageTag } from "$paraglide/runtime";
import {
  availableSearchIndexes,
  type SearchableArticleAttributes,
  type SearchableEventAttributes,
  type SearchableIndex,
  type SearchableMemberAttributes,
  type SearchablePositionAttributes,
  type SearchableSongAttributes,
} from "./searchTypes";

export type SearchIndex =
  (typeof availableSearchIndexes)[keyof typeof availableSearchIndexes];

export function getFederatedWeight(index: SearchableIndex): number {
  switch (index) {
    case "members":
      return 5;
    case "events":
      return 1;
    case "articles":
      return 1;
    case "positions":
      return 5;
    case "songs":
      return 1;
    default:
      return 1;
  }
}

export function getSearchableAttributes(
  index: SearchableIndex,
  language: AvailableLanguageTag,
) {
  switch (index) {
    case "members": {
      // no language specific fields
      const res: Array<keyof SearchableMemberAttributes> = [
        "firstName",
        "lastName",
        "nickname",
        "studentId",
        "fullName",
      ];
      return res;
    }
    case "events": {
      let res: Array<keyof SearchableEventAttributes>;
      if (language === "sv") {
        res = ["title", "description"];
      } else {
        res = ["titleEn", "descriptionEn"];
      }
      return res;
    }
    case "articles": {
      let res: Array<keyof SearchableArticleAttributes>;
      if (language === "sv") {
        res = ["header", "body"];
      } else {
        res = ["headerEn", "bodyEn"];
      }
      return res;
    }
    case "positions": {
      let res: Array<keyof SearchablePositionAttributes>;
      if (language === "sv") {
        res = ["name", "description", "committeeName", "dsekId"];
      } else {
        res = ["nameEn", "descriptionEn", "committeeNameEn", "dsekId"];
      }
      return res;
    }
    case "songs": {
      // no language specific fields
      const res: Array<keyof SearchableSongAttributes> = [
        "title",
        "lyrics",
        "melody",
        "category",
      ];
      return res;
    }
  }
}
