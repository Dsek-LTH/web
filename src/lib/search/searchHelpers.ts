import type { AvailableLanguageTag } from "$paraglide/runtime";
import {
  availableSearchIndexes,
  type SearchableArticleAttributes,
  type SearchableCommitteeAttributes,
  type SearchableEventAttributes,
  type SearchableIndex,
  type SearchableMemberAttributes,
  type SearchablePositionAttributes,
  type SearchableSongAttributes,
} from "./searchTypes";
import * as m from "$paraglide/messages";

export type SearchIndex =
  (typeof availableSearchIndexes)[keyof typeof availableSearchIndexes];

/**
 * Get the federated weight for a given index
 * This is used to give a higher weight to certain indexes
 * when searching. For example, we want members to be more
 * important than events. This is done by giving members
 * a higher weight.
 */
export function getFederatedWeight(index: SearchableIndex): number {
  switch (index) {
    case "members":
      return 1.5;
    case "events":
      return 1;
    case "articles":
      return 1;
    case "positions":
      return 1.5;
    case "songs":
      return 1;
    case "committees":
      return 2;
    default:
      return 0;
  }
}

/**
 * Get the searchable attributes for a given index and language
 * If for whatever reason the language is not supported, or our
 * systems fail to provide a language, swedish will be used as default.
 */
export function getSearchableAttributes(
  index: SearchableIndex,
  language: AvailableLanguageTag,
) {
  switch (index) {
    case "members": {
      // no language specific fields
      const res: Array<keyof SearchableMemberAttributes> = [
        "fullName",
        "firstName",
        "lastName",
        "nickname",
        "studentId",
      ];
      return res;
    }
    case "events": {
      // default is swedish
      let res: Array<keyof SearchableEventAttributes> = [
        "title",
        "description",
      ];
      if (language === "en") {
        res = ["titleEn", "descriptionEn"];
      }
      return res;
    }
    case "articles": {
      // default is swedish
      let res: Array<keyof SearchableArticleAttributes> = ["header", "body"];
      if (language === "en") {
        res = ["headerEn", "bodyEn"];
      }
      return res;
    }
    case "positions": {
      // default is swedish
      let res: Array<keyof SearchablePositionAttributes> = [
        "name",
        "description",
        "committeeName",
        "dsekId",
      ];
      if (language === "en") {
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
    case "committees": {
      // default is swedish
      let res: Array<keyof SearchableCommitteeAttributes> = [
        "name",
        "description",
      ];
      if (language === "en") {
        res = ["nameEn", "descriptionEn"];
      }
      return res;
    }
    default:
      return [];
  }
}

export function mapIndexToMessage(index: SearchableIndex) {
  switch (index) {
    case "members":
      return m.search_members();
    case "positions":
      return m.search_positions();
    case "articles":
      return m.search_articles();
    case "events":
      return m.search_events();
    case "songs":
      return m.search_songs();
    case "committees":
      return m.search_committees();
    default:
      return "";
  }
}
