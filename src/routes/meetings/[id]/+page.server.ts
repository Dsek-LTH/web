import { policyAccessGuard, withAccess } from "$lib/utils/access.js";
import apiNames from "$lib/utils/apiNames.js";
import prisma from "$lib/utils/prisma.js";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { MEETING_TYPE, meetingSchema } from "../schemas.js";
import { z } from "zod";
export const load = async ({ parent, params }) => {
  const meeting = await prisma.meeting.findUnique({
    where: {
      id: params.id,
    },
    include: {
      attachments: true,
      items: {
        orderBy: {
          order: "asc",
        },
        include: {
          attachments: true,
        },
      },
    },
  });
  if (!meeting) throw error(404);
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.MEETINGS.READ, accessPolicies);
  return {
    meeting,
    updateForm: superValidate({ ...meeting, type: meeting.type as MEETING_TYPE }, meetingSchema),
    addItemsForm: superValidate({ items: [] }, addItemSchema),
    updateItemForm: superValidate(updateItemSchema),
  };
};

const addItemSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
});
export type AddItemSchema = typeof addItemSchema;
const updateItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  concluded: z.boolean().optional(),
  comment: z.string().nullable().optional(),
});
export type UpdateItemSchema = typeof updateItemSchema;

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
  addItems: async (event) => {
    const form = await superValidate(event.request, addItemSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.MEETINGS.UPDATE,
      session?.user,
      async () => {
        const currentCount = await prisma.meetingAgendaItem.count({
          where: {
            meeting: {
              id: event.params.id,
            },
          },
        });
        await prisma.meeting.update({
          where: {
            id: event.params.id,
          },
          data: {
            items: {
              createMany: {
                data: form.data.items.map((item) => ({
                  ...item,
                  order: currentCount + item.order,
                })),
              },
            },
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
  updateItem: async (event) => {
    const form = await superValidate(event.request, updateItemSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.MEETINGS.UPDATE,
      session?.user,
      async () => {
        await prisma.meetingAgendaItem.update({
          where: {
            id: form.data.id,
          },
          data: {
            ...form.data,
          },
        });
        return message(form, {
          message: "Punkt uppdaterad",
          type: "hidden",
        });
      },
      form
    );
  },
};
