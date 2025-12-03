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
  WEBSHOP: {
    PURCHASE: "webshop:purchase",
    CREATE: "webshop:create",
    READ_PURCHASES: "webshop:read_purchases",
    CONSUME: "webshop:consume",
    MANAGE: "webshop:manage",
  },
  NOLLNING: {
    MANAGE_PHADDER_GROUPS: "nollning:phaddrar:groups:manage",
  },
  EXPENSES: {
    CREATE: "expenses:create", // who can create expenses, probably all volunteers or logged in
    CERTIFICATION: "expenses:certification", // who can ALWAYS certify/sign expenses. As of writing this is treasurer and president.
    BOOKKEEPING: "expenses:bookkeeping", // who can manage expenses for bookkeeping
  },
  CAFE: {
    EDIT_WORKERS: "cafe:edit_workers"
  }
} as const;

export default apiNames;
