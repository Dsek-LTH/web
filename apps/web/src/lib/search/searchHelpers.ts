import type { SearchableIndex } from "./searchTypes";
import * as m from "$paraglide/messages";

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
    case "governingDocuments":
      return m.search_governing_documents();
    case "meetingDocuments":
      return m.search_meeting_documents();
    default:
      return "";
  }
}

function bytesToBase64(bytes: ArrayLike<number>): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}

/**
 * The id a database row gets as a Meilisearch document: the base64 of its
 * UTF-8 bytes without the characters Meilisearch doesn't allow in ids.
 * Must match the Go backend's internal/search meiliID - MemberSelector
 * decodes a member hit's id back into the member's UUID, so member values
 * built outside a search (e.g. a booking's existing access list) need the
 * same encoding.
 */
export function searchDocumentId(id: string) {
  // btoa cannot handle characters larger than 1 byte
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#exceptions
  return bytesToBase64(new TextEncoder().encode(id))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .trim();
}
