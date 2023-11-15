const crud = <prefix extends string>(base: prefix) =>
  ({
    CREATE: `${base}:create`,
    READ: `${base}:read`,
    UPDATE: `${base}:update`,
    DELETE: `${base}:delete`,
  }) as const;

const apiNames = {
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
  MANDATE: crud("core:mandate"),
  COMMITTEE: crud("core:committee"),
  POSITION: {
    ...crud("core:position"),
    SEE_INACTIVE: "core:position:inactive:read",
  },
  ACCESS_POLICY: crud("core:access:api"),
  LOGGED_IN: "_",
  FILES: {
    BUCKET: <bucketName extends string>(name: bucketName) =>
      crud(`fileHandler:${name.startsWith("dev-") ? name.substring(4) : name}`), // remove "dev-" prefix
  },
  MARKDOWNS: {
    ...crud("markdowns"),
    PAGE: <markdownDocumentName extends string>(name: markdownDocumentName) =>
      crud(`markdowns:${name}`),
  },
  MEMBER: {
    ...crud("core:member"),
    PING: "core:member:ping",
  },
} as const;

export default apiNames;
