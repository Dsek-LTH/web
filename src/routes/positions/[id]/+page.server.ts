import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const position = await prisma.position.findUnique({
    where: {
      id: params.id,
    },
    include: {
      mandates: {
        include: {
          member: true,
        },
        orderBy: [
          {
            member: {
              firstName: "asc",
            },
          },
          {
            member: {
              lastName: "asc",
            },
          },
        ],
      },
      emailAliases: {
        select: {
          email: true,
        },
      },
    },
  });
  if (!position) {
    throw error(404, "Position not found");
  }
  const editedMandateID = url.searchParams.get("editMandate");
  const editedMandate = position.mandates.find((m) => m.id === editedMandateID);
  return {
    updateForm: superValidate(position, updateSchema),
    addMandateForm: superValidate(addManadateSchema),
    updateMandateForm: editedMandate
      ? superValidate(editedMandate, updateMandateSchema)
      : superValidate(updateMandateSchema),
    deleteMandateForm: superValidate(deleteMandateSchema),
    position,
    mandates: position.mandates,
  };
};

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  email: z.string().email().nullable(),
});
export type UpdatePositionSchema = typeof updateSchema;

const END_OF_YEAR = new Date(`${new Date().getFullYear()}-12-31T23:59:59`);

const addManadateSchema = z.object({
  memberId: z.string().uuid(),
  startDate: z.coerce.date().default(new Date()),
  endDate: z.coerce.date().default(END_OF_YEAR),
});
export type AddMandateSchema = typeof addManadateSchema;

const updateMandateSchema = z.object({
  mandateId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateMandateSchema = typeof updateMandateSchema;

const deleteMandateSchema = z.object({
  mandateId: z.string().uuid(),
});
export type DeleteMandateSchema = typeof deleteMandateSchema;

export const actions = {
  update: async ({ params, request, locals }) => {
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.POSITION.UPDATE,
      session?.user,
      async () => {
        await prisma.position.update({
          where: { id: params.id },
          data: {
            name: form.data.name,
            description: form.data.description,
            email: form.data.email,
          },
        });
        return message(form, {
          message: "Position uppdaterad",
          type: "success",
        });
      },
      form,
    );
  },
  addMandate: async ({ params, request, locals }) => {
    const form = await superValidate(request, addManadateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.MANDATE.CREATE,
      session?.user,
      async () => {
        const member = await prisma.member.findUnique({
          where: { id: form.data.memberId },
        });
        if (!member) return setError(form, "memberId", "Medlemmen finns inte");
        await prisma.mandate.create({
          data: {
            positionId: params.id,
            memberId: form.data.memberId,
            startDate: form.data.startDate,
            endDate: form.data.endDate,
          },
        });
        return message(form, {
          message: `Nytt mandat gett till ${member.firstName}`,
          type: "success",
        });
      },
      form,
    );
  },
  updateMandate: async (event) => {
    const { params, request, locals } = event;
    const form = await superValidate(request, updateMandateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.MANDATE.UPDATE,
      session?.user,
      async () => {
        const member = await prisma.member.findFirst({
          where: {
            mandates: {
              some: {
                id: form.data.mandateId,
              },
            },
          },
        });
        if (!member)
          return message(
            form,
            { message: "Mandatet hittades inte", type: "error" },
            { status: 400 },
          );
        await prisma.mandate.update({
          where: { id: form.data.mandateId, positionId: params.id },
          data: {
            startDate: form.data.startDate,
            endDate: form.data.endDate,
          },
        });
        throw redirect(
          `/positions/${params.id}`,
          {
            message: `${member.firstName}${
              member.firstName?.endsWith("s") ? "" : "s"
            } mandat har uppdateras`,
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
  deleteMandate: async ({ params, request, locals }) => {
    const form = await superValidate(request, deleteMandateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.MANDATE.DELETE,
      session?.user,
      async () => {
        const member = await prisma.member.findFirst({
          where: {
            mandates: {
              some: {
                id: form.data.mandateId,
              },
            },
          },
        });
        if (!member)
          return message(
            form,
            { message: "Mandatet hittades inte", type: "error" },
            { status: 400 },
          );
        await prisma.mandate.delete({
          where: { id: form.data.mandateId, positionId: params.id },
        });
        return message(form, {
          message: `${member.firstName}${
            member.firstName?.endsWith("s") ? "" : "s"
          } mandat har tagits bort`,
          type: "success",
        });
      },
      form,
    );
  },
};
