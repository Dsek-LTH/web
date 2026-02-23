// redirect to /members/studentId with their student id

import { redirect } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const { user } = locals;
  if (!user?.studentId) {
    throw error(401, m.members_errors_meNotFound());
  }
  throw redirect(302, `/members/${user.studentId}`);
};
