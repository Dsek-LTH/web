import { error } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { member } = locals;
  if (!member) throw error(401, "You must be logged in to handle expenses");
};
