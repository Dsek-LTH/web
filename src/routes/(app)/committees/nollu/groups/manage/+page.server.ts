import {
  phadderGroupSchema,
  phadderMandateFilter,
} from "$lib/nollning/groups/types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import DOMPurify from "isomorphic-dompurify";
import { fail, message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import * as m from "$paraglide/messages";

const getPhadderMandates = async (
  prisma: ExtendedPrisma,
  memberId: string,
  year: number,
) =>
  prisma.mandate.findMany({
    where: {
      memberId,
      ...phadderMandateFilter(year),
    },
    orderBy: [
      {
        positionId: "asc", // regular phadder comes before uppdrag
      },
      {
        startDate: "asc",
      },
    ],
  });

export const load = async ({ locals }) => {
  const { user, prisma } = locals;
  authorize(apiNames.NOLLNING.MANAGE_PHADDER_GROUPS, user);

  const phadderGroups = await prisma.phadderGroup.findMany({
    include: {
      nollor: true,
      phaddrar: {
        include: {
          member: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    groups: await Promise.all(
      phadderGroups.map(async (group) => ({
        ...group,
        form: await superValidate(group, zod4(phadderGroupSchema)),
      })),
    ),
    form: await superValidate(zod4(createPhadderGroupSchema)),
  };
};

const createPhadderGroupSchema = phadderGroupSchema.omit({
  id: true,
});
const updatePhadderGroupSchema = phadderGroupSchema;
const deletePhadderGroupSchema = phadderGroupSchema.pick({
  id: true,
});

const personSchema = z.object({
  studentId: z.string(),
  groupId: z.string().uuid(),
});

const addPersonSchema = z.object({
  studentId: z.array(z.string()).min(1),
  groupId: z.string().uuid(),
});

export const actions = {
  create: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(createPhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    form.data.description = form.data.description
      ? DOMPurify.sanitize(form.data.description)
      : form.data.description;
    await prisma.phadderGroup.create({
      data: form.data,
    });
    return message(form, {
      message: m.nollu_manage_groupCreated(),
      type: "success",
    });
  },
  update: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(updatePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    form.data.description = form.data.description
      ? DOMPurify.sanitize(form.data.description)
      : form.data.description;
    const res = await prisma.phadderGroup.update({
      where: {
        id: form.data.id,
      },
      data: form.data,
    });
    console.log(res);
    return message(form, {
      message: m.nollu_manage_groupUpdated(),
      type: "success",
    });
  },
  delete: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(deletePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    await prisma.phadderGroup.delete({
      where: {
        id: form.data.id,
      },
    });
    return message(form, {
      message: m.nollu_manage_groupDeleted(),
      type: "success",
    });
  },
  addNolla: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(addPersonSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const members = await prisma.member.findMany({
      where: { studentId: { in: form.data.studentId } },
    });
    if (members.length !== form.data.studentId.length) {
      return setError(form, m.nollu_manage_membersNotFound());
    }
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        nollor: {
          connect: members.map((member) => ({ id: member.id })),
        },
      },
    });
    return message(form, {
      message: m.nollu_manage_nollaAdded(),
      type: "success",
    });
  },
  removeNolla: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const member = await prisma.member.findUnique({
      where: { studentId: form.data.studentId },
    });
    if (!member)
      return setError(form, "studentId", m.nollu_manage_memberNotFound());
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        nollor: {
          disconnect: {
            id: member.id,
          },
        },
      },
    });
    return message(form, {
      message: m.nollu_manage_nollaRemoved(),
      type: "success",
    });
  },
  addPhadder: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(addPersonSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const group = await prisma.phadderGroup.findUnique({
      where: {
        id: form.data.groupId,
      },
    });
    if (!group)
      return setError(form, "groupId", m.nollu_manage_groupNotFound());
    const members = await prisma.member.findMany({
      where: { studentId: { in: form.data.studentId } },
    });
    if (members.length !== form.data.studentId.length) {
      return setError(form, m.nollu_manage_membersNotFound());
    }
    const withMandates = await Promise.all(
      members.map(async (member) => ({
        member,
        mandate: (await getPhadderMandates(prisma, member.id, group.year))[0],
      })),
    );
    const missingMandate = withMandates.filter((entry) => !entry.mandate);
    if (missingMandate.length > 0) {
      return setError(
        form,
        m.nollu_manage_notPhadderThatYear({
          names: missingMandate
            .map(
              (entry) => `${entry.member.firstName} ${entry.member.lastName}`,
            )
            .join(", "),
        }),
      );
    }
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        phaddrar: {
          connect: withMandates.map((entry) => ({ id: entry.mandate!.id })),
        },
      },
    });
    return message(form, {
      message: m.nollu_manage_phadderAdded(),
      type: "success",
    });
  },
  removePhadder: async ({ locals, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const group = await prisma.phadderGroup.findUnique({
      where: {
        id: form.data.groupId,
      },
    });
    if (!group)
      return setError(form, "groupId", m.nollu_manage_groupNotFound());
    const member = await prisma.member.findUnique({
      where: { studentId: form.data.studentId },
    });
    if (!member)
      return setError(form, "studentId", m.nollu_manage_memberNotFound());
    const mandates = await getPhadderMandates(prisma, member.id, group?.year);
    if (mandates.length === 0)
      return setError(
        form,
        "studentId",
        m.nollu_manage_personNotPhadderThatYear(),
      );
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        phaddrar: {
          disconnect: mandates.map((mandate) => ({
            id: mandate.id,
          })),
        },
      },
    });
    return message(form, {
      message: m.nollu_manage_phadderRemoved(),
      type: "success",
    });
  },
};
