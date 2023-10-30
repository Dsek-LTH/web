const crud = <prefix extends string>(base: prefix) => ({
  CREATE: `${base}:create`,
  READ: `${base}:read`,
  UPDATE: `${base}:update`,
  DELETE: `${base}:delete`,
});

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
  ACCESS_POLICY: crud("core:access:api"),
  LOGGED_IN: "_",
  FILES: {
    BUCKET: <bucketName extends string>(name: bucketName) => crud(`fileHandler:${name}`),
  },
} as const;

export default apiNames;
