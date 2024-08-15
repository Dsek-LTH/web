import {
  phadderGroupSchema,
  phadderMandateFilter,
} from "$lib/nollning/groups/types.js";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import type { PrismaClient } from "@prisma/client";
import { fail, message, setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";

const getPhadderMandates = async (
  prisma: PrismaClient,
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
        form: await superValidate(group, zod(phadderGroupSchema)),
      })),
    ),
    form: await superValidate(zod(createPhadderGroupSchema)),
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
  memberId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const actions = {
  create: async ({ locals, request }) => {
    const form = await superValidate(request, zod(createPhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    await prisma.phadderGroup.create({
      data: form.data,
    });
    return message(form, {
      message: "Phaddergruppen skapades",
      type: "success",
    });
  },
  update: async ({ locals, request }) => {
    const form = await superValidate(request, zod(updatePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const res = await prisma.phadderGroup.update({
      where: {
        id: form.data.id,
      },
      data: form.data,
    });
    console.log(res);
    return message(form, {
      message: "Phaddergruppen uppdaterad",
      type: "success",
    });
  },
  delete: async ({ locals, request }) => {
    const form = await superValidate(request, zod(deletePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    await prisma.phadderGroup.delete({
      where: {
        id: form.data.id,
      },
    });
    return message(form, {
      message: "Phaddergruppen borttagen",
      type: "success",
    });
  },
  addNolla: async ({ locals, request }) => {
    const form = await superValidate(request, zod(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        nollor: {
          connect: {
            id: form.data.memberId,
          },
        },
      },
    });
    return message(form, {
      message: "Nolla tillagd",
      type: "success",
    });
  },
  removeNolla: async ({ locals, request }) => {
    const form = await superValidate(request, zod(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        nollor: {
          disconnect: {
            id: form.data.memberId,
          },
        },
      },
    });
    return message(form, {
      message: "Nolla borttagen",
      type: "success",
    });
  },
  addPhadder: async ({ locals, request }) => {
    const form = await superValidate(request, zod(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const group = await prisma.phadderGroup.findUnique({
      where: {
        id: form.data.groupId,
      },
    });
    if (!group) return setError(form, "groupId", "Group not found");
    const mandate = await getPhadderMandates(
      prisma,
      form.data.memberId,
      group.year,
    ).then((mandates) => mandates?.[0]); // get first

    if (!mandate)
      return setError(
        form,
        "memberId",
        "Personen hittas inte som phadder det året",
      );
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        phaddrar: {
          connect: {
            id: mandate.id,
          },
        },
      },
    });
    return message(form, {
      message: "Phadder tillagd",
      type: "success",
    });
  },
  removePhadder: async ({ locals, request }) => {
    const form = await superValidate(request, zod(personSchema));
    if (!form.valid) return fail(400, { form });
    const { prisma } = locals;
    const group = await prisma.phadderGroup.findUnique({
      where: {
        id: form.data.groupId,
      },
    });
    if (!group) return setError(form, "groupId", "Group not found");
    const mandates = await getPhadderMandates(
      prisma,
      form.data.memberId,
      group?.year,
    );
    if (mandates.length === 0)
      return setError(
        form,
        "memberId",
        "Personen hittas inte som phadder det året",
      );
    await prisma.phadderGroup.update({
      where: {
        id: form.data.groupId,
      },
      data: {
        phaddrar: {
          disconnect: mandates.map((m) => ({
            id: m.id,
          })),
        },
      },
    });
    return message(form, {
      message: "Phadder borttagen",
      type: "success",
    });
  },
};
