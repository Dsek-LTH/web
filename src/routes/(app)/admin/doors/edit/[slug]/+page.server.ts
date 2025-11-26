import apiNames from "$lib/utils/apiNames";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { error, fail } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import * as m from "$paraglide/messages";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export const load: PageServerLoad = async ({ locals, params, parent }) => {
  const { prisma, user } = locals;
  authorize(apiNames.DOOR.READ, user);

  const { doors } = await parent();
  const door = doors.find((door) => door.name === params.slug);

  if (!door) error(404, m.admin_doors_notFound());

  const doorAccessPolicies = await prisma.doorAccessPolicy.findMany({
    where: {
      doorName: params.slug,
      OR: [{ endDatetime: { gte: new Date() } }, { endDatetime: null }],
    },
    include: { member: true },
    orderBy: [{ startDatetime: "asc" }, { role: "asc" }, { studentId: "asc" }],
  });

  return {
    door,
    doorAccessPolicies,
    createForm: await superValidate(zod4(createSchema)),
    deleteForm: await superValidate(zod4(deleteSchema)),
  };
};

const createSchema = z
  .object({
    subject: z.string().min(1),
    type: z.enum(["member", "role"]).default("member"),
    mode: z.enum(["allow", "deny"]).default("allow"),
    startDatetime: z.string().date().optional(),
    endDatetime: z.string().date().optional(),
    reason: z.string().optional(),
  })
  // These refinements return true for valid data, but it's
  // easier to express them in terms of what is invalid.
  .refine(
    // Require the start date to be before the end date
    ({ startDatetime: start, endDatetime: end }) =>
      !(start && end && dayjs(end).isBefore(start)),
    { message: m.admin_doors_endDateBeforeStart(), path: ["endDatetime"] },
  )
  .refine(
    // Require an end date for member rules
    (data) => !(data.type === "member" && !data.endDatetime),
    { message: m.admin_doors_memberRuleRequireEnd(), path: ["endDatetime"] },
  )
  .refine(
    // Require a reason for member rules
    (data) => !(data.type === "member" && !data.reason),
    { message: m.admin_doors_memberRuleRequireReason(), path: ["reason"] },
  )
  .refine(
    // Require a reason for bans
    (data) => !(data.mode === "deny" && !data.reason),
    { message: m.admin_doors_banRuleRequireReason(), path: ["reason"] },
  )
  .refine(
    // TODO: Banning groups is not implemented
    (data) => !(data.type === "role" && data.mode === "deny"),
    { message: "Not implemented", path: ["mode"] },
  )
  .refine(
    async (data) => {
      if (data.type === "member") {
        // check if member exists
        return await authorizedPrismaClient.member.findFirst({
          where: { studentId: data.subject },
        });
      } else {
        // check if role exists
        return (
          data.subject === "*" ||
          (await authorizedPrismaClient.position.findFirst({
            where: { id: { startsWith: `${data.subject}%` } },
          }))
        );
      }
    },
    { message: m.admin_doors_memberOrRoleNotFound(), path: ["subject"] },
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
    const { mode, subject, type, startDatetime, endDatetime, reason } =
      form.data;

    await prisma.doorAccessPolicy.create({
      data: {
        doorName,
        startDatetime: dayjs(startDatetime)
          .startOf("day")
          .tz("Europe/Stockholm", true)
          .toDate(),
        endDatetime: dayjs(endDatetime)
          .endOf("day")
          .tz("Europe/Stockholm", true)
          .toDate(),
        isBan: mode === "deny",
        information: reason,
        ...(type === "member" ? { studentId: subject } : { role: subject }),
      },
    });

    return message(form, {
      message: m.admin_doors_ruleCreated(),
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
      message: m.admin_doors_ruleDeleted(),
      type: "success",
    });
  },
};
