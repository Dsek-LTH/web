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
  },
  TAGS: {
    ...crud("tags"),
  },
  EVENT: {
    ...crud("event"),
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
      crud(`fileHandler:${name.substring(4)}`), // remove "dev-" prefix
  },
  MEMBER: {
    ...crud("core:member"),
    PING: "core:member:ping",
  },
} as const;

export default apiNames;
