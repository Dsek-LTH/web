const crud = (base: string) => ({
  CREATE: `${base}:create`,
  READ: `${base}:read`,
  UPDATE: `${base}:update`,
  DELETE: `${base}:delete`,
});

const apiNames = {
  NEWS: {
    CREATE: "news:create",
  },
  ACCESS_POLICY: crud("access_policy"),
};

export default apiNames;
