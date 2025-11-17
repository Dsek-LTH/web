import apiNames from "$lib/utils/apiNames";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { fail } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.DOOR.READ, user);

  const doorAccessPolicies = await prisma.doorAccessPolicy.findMany({
    where: {
      doorName: params.slug,
      OR: [{ endDatetime: { gte: new Date() } }, { endDatetime: null }],
    },
    include: { member: true },
    orderBy: [{ startDatetime: "asc" }, { role: "asc" }, { studentId: "asc" }],
  });

  return {
    doorAccessPolicies,
    createForm: await superValidate(zod4(createSchema)),
    deleteForm: await superValidate(zod4(deleteSchema)),
  };
};

// TODO: require reason and end date for member rules
// TODO: don't allow banning groups since this is not implemented
const createSchema = z
  .object({
    subject: z.string().min(1),
    type: z.enum(["member", "role"]).default("member"),
    mode: z.enum(["allow", "deny"]).default("allow"),
    startDatetime: z.date().optional(),
    endDatetime: z.date().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => (data.startDatetime ?? 0) < (data.endDatetime ?? Infinity),
    {
      message: "Slutdatum kan inte vara före startdatum",
      path: ["endDatetime"],
    },
  )
  .refine(
    async ({ type, subject }) => {
      if (type === "member") {
        // check if member exists
        return await authorizedPrismaClient.member.findFirst({
          where: { studentId: subject },
        });
      } else {
        // check if role exists
        return await authorizedPrismaClient.position.findFirst({
          where: { id: { startsWith: `${subject}%` } },
        });
      }
    },
    { message: "Medlemmen/rollen finns inte", path: ["subject"] },
  );

const deleteSchema = z.object({
  id: z.string(),
});

export const actions: Actions = {
  create: async ({ request, locals, params }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });
    const doorName = params.slug;
    const { mode, subject, type, startDatetime, endDatetime } = form.data;

    await prisma.doorAccessPolicy.create({
      data: {
        doorName,
        startDatetime,
        endDatetime,
        isBan: mode === "deny",
        ...(type === "member" ? { studentId: subject } : { role: subject }),
      },
    });

    return message(form, {
      message: "Dörrpolicy skapad",
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.doorAccessPolicy.delete({
      where: { id },
    });
    return message(form, {
      message: "Dörrpolicy raderad",
      type: "success",
    });
  },
};
