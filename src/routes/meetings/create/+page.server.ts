import { policyAccessGuard, withAccess } from "$lib/utils/access.js";
import apiNames from "$lib/utils/apiNames.js";
import prisma from "$lib/utils/prisma.js";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { meetingSchema } from "../schemas.js";

export const load = async ({ parent }) => {
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.MEETINGS.CREATE, accessPolicies);
  return {
    form: await superValidate(meetingSchema),
  };
};

export const actions = {
  default: async (event) => {
    const form = await superValidate(event.request, meetingSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.MEETINGS.CREATE,
      session?.user,
      async () => {
        const result = await prisma.meeting.create({
          data: {
            ...form.data,
          },
        });
        throw redirect(
          `/meetings/${result.id}`,
          {
            message: "Möte skapat",
            type: "success",
          },
          event
        );
      },
      form
    );
  },
};
