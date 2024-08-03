import type { Actions } from "./$types";

export const actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const search = data.get("input");
    if (typeof search !== "string") return;
    const response = await event.fetch(
      "/api/members?" + new URLSearchParams({ search }),
    );
    const users = await response.json();
    return { users };
  },
} satisfies Actions;
