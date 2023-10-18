const crud = (base: string) => ({
  CREATE: `${base}:create`,
  READ: `${base}:read`,
  UPDATE: `${base}:update`,
  DELETE: `${base}:delete`,
});

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
};

export default apiNames;
