import { policyAccessGuard, withAccess } from "$lib/utils/access.js";
import apiNames from "$lib/utils/apiNames.js";
import prisma from "$lib/utils/prisma.js";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { MEETING_TYPE, meetingSchema } from "../schemas.js";
export const load = async ({ parent, params }) => {
  const meeting = await prisma.meeting.findUnique({
    where: {
      id: params.id,
    },
    include: {
      attachments: true,
    },
  });
  if (!meeting) throw error(404);
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.MEETINGS.READ, accessPolicies);
  return {
    meeting,
    updateForm: superValidate({ ...meeting, type: meeting.type as MEETING_TYPE }, meetingSchema),
  };
};

export const actions = {
  update: async (event) => {
    const form = await superValidate(event.request, meetingSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.MEETINGS.UPDATE,
      session?.user,
      async () => {
        await prisma.meeting.update({
          where: {
            id: event.params.id,
          },
          data: {
            ...form.data,
          },
        });
        return message(form, {
          message: "Möte uppdaterat",
          type: "success",
        });
      },
      form
    );
  },
  delete: async (event) => {
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.MEETINGS.DELETE,
      session?.user,
      async () => {
        await prisma.meeting.delete({
          where: {
            id: event.params.id,
          },
        });
        throw redirect(
          `/meetings`,
          {
            message: "Möte raderat",
            type: "success",
          },
          event
        );
      },
      undefined
    );
  },
};
