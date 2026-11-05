const crud = <prefix extends string>(base: prefix) =>
  ({
    CREATE: `${base}:create`,
    READ: `${base}:read`,
    UPDATE: `${base}:update`,
    DELETE: `${base}:delete`,
  }) as const;

const apiNames = {
  ALERT: "alert",
  MEDALS: {
    MANAGE: "medals:manage",
  },
  NEWS: {
    ...crud("news:article"),
    MANAGE: "news:article:manage",
    LIKE: "news:article:like",
    COMMENT: "news:article:comment",
    COMMENT_DELETE: "news:article:comment:delete",
  },
  TAGS: {
    ...crud("tags"),
  },
  EVENT: {
    ...crud("event"),
    COMMENT: "event:comment",
    COMMENT_DELETE: "event:comment:delete",
  },
  BOOKINGS: {
    ...crud("booking_request"),
  },
  BOOKABLES: {
    ...crud("booking_request:bookable"),
  },
  MANDATE: crud("core:mandate"),
  COMMITTEE: crud("core:committee"),
  POSITION: {
    ...crud("core:position"),
    SEE_INACTIVE: "core:position:inactive:read",
  },
  ADMIN: {
    CORE: "core:admin",
    READ: "core:access:admin:read",
    SETTINGS: crud("admin:settings"),
    SHLINK: crud("admin:shlink"),
  },
  ACCESS_POLICY: crud("core:access:api"),
  EMAIL_ALIAS: crud("core:mail:alias"),
  FILES: {
    BUCKET: <bucketName extends string>(name: bucketName) =>
      crud(`fileHandler:${name}`), // remove "dev-" prefix
  },
  MARKDOWNS: {
    ...crud("markdowns"),
    PAGE: <markdownDocumentName extends string>(name: markdownDocumentName) =>
      crud(`markdowns:${name}`),
  },
  MARKDOWN: {
    ...crud("markdown"),
  },
  MEMBER: {
    ...crud("core:member"),
    SEE_STABEN: "member:see_staben",
    SEE_EMAIL: "member:see_email",
    PING: "core:member:ping",
    USER: "member:user",
  },
  GOVERNING_DOCUMENT: {
    CREATE: "governing_document:write",
    READ: "governing_document:read",
    UPDATE: "governing_document:write",
    DELETE: "governing_document:write",
  },
  ELECTION: {
    ...crud("election"),
  },
  DOOR: {
    ...crud("core:access:door"),
  },
  YRKA: {
    SEND: "yrka:send",
  },
  SONG: {
    ...crud("song"),
  },
  NOLLNING: {
    MANAGE_PHADDER_GROUPS: "nollning:phaddrar:groups:manage",
    MANAGE_SEASONS: "nollning:season:manage",
  },
  CAFE: {
    EDIT_WORKERS: "cafe:edit_workers",
    EDIT_CIABATTAS: "cafe:edit_ciabattas",
    SEE_ALL_WEEKS: "cafe:see_all_weeks",
    DAY_MANAGER: "cafe:day_manager",
  },
  // The free-ticket releases (internal/tickets, upstream #1325) reuse the
  // old webshop's policies, so existing grants keep working - only these
  // two, the rest of the webshop group went with the shop.
  WEBSHOP: {
    CREATE: "webshop:create",
    MANAGE: "webshop:manage",
  },
} as const;

export default apiNames;

/**
 * Flattens the apiNames registry into every concrete apiName string it
 * declares. Entries that are functions (e.g. `FILES.BUCKET(name)`,
 * `MARKDOWNS.PAGE(name)`) require a runtime parameter and can't be
 * enumerated, so they're skipped.
 */
export const flattenApiNames = (obj: unknown): string[] => {
  if (typeof obj === "string") return [obj];
  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).flatMap(flattenApiNames);
  }
  return [];
};
