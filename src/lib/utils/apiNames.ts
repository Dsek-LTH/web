const crud = <T extends string>(base: T) =>
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
  },
  TAGS: {
    ...crud("tags"),
  },
  EVENT: {
    ...crud("event"),
  },
  ACCESS_POLICY: crud("core:access:api"),
} as const;

export default apiNames;
