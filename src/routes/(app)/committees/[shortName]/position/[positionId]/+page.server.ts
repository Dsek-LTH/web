import { error, fail } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { getLocale } from "$paraglide/runtime";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { redirect } from "sveltekit-flash-message/server";
import { committeeToPositionMap } from "$lib/utils/positions";

dayjs.extend(utc);

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;

  let position = await prisma.position.findFirst({
    where: {
      id: `dsek.${committeeToPositionMap[params.shortName as keyof typeof committeeToPositionMap]}.${params.positionId}`,
    },
    include: {
      committee: true,
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
  if (position == undefined) {
    position = await prisma.position.findUnique({
      where: {
        id: params.positionId,
      },
      include: {
        committee: true,
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
  }
  if (!position) {
    throw error(404, m.positions_errors_positionNotFound());
  }

  //Logic for startMonth and endMonth that can wrap over new years

  //If the mandateperiod is within a year the endMonth will be greater than the startMonth which gives the difference:
  //(position.endMonth - position.startMonth) to be added.

  //If the mandateperiod wraps into a new year (and is a year or less) the endMonth will be smaller than the startMonth.
  //The months that need to be added in this case is a full year minus the difference between the months:
  //12 - Math.abs(position.endMonth - position.startMonth)

  const addMandateMonthDifference =
    position.endMonth > position.startMonth
      ? position.endMonth - position.startMonth
      : 12 - Math.abs(position.endMonth - position.startMonth);

  return {
    updateForm: superValidate(position, zod4(updateSchema)),
    addMandateForm: superValidate(zod4(addMandateSchema), {
      defaults: {
        memberIds: [],
        startDate: dayjs()
          .month(position.startMonth)
          .utc()
          .startOf("month")
          .toDate(),
        endDate: dayjs()
          .month(position.startMonth)
          .utc()
          .startOf("month")
          .add(addMandateMonthDifference, "months")
          .endOf("month")
          .toDate(),
      },
    }),
    updateMandateForm: superValidate(zod4(updateMandateSchema)),
    deleteMandateForm: superValidate(zod4(deleteMandateSchema)),
    position,
    mandates: position.mandates,
  };
};

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  email: z.string().email().nullable(),
});
export type UpdatePositionSchema = Infer<typeof updateSchema>;

const END_OF_YEAR = new Date(`${new Date().getFullYear()}-12-31T23:59:59`);

const addMandateSchema = z
  .object({
    memberIds: z.uuid().array(),
    startDate: z.coerce.date().default(new Date()),
    endDate: z.coerce.date().default(END_OF_YEAR),
  })
  .refine(
    (obj) => obj.endDate.getTime() - obj.startDate.getTime() > 0,
    m.positions_date_error(),
  );
export type AddMandateSchema = Infer<typeof addMandateSchema>;

const updateMandateSchema = z
  .object({
    mandateId: z.string().uuid(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (obj) =>
      obj.startDate && obj.endDate
        ? obj.endDate.getTime() - obj.startDate.getTime() > 0
        : true,
    m.positions_date_error(),
  );
export type UpdateMandateSchema = Infer<typeof updateMandateSchema>;

const deleteMandateSchema = z.object({
  mandateId: z.string().uuid(),
});
export type DeleteMandateSchema = Infer<typeof deleteMandateSchema>;

const genitiveCase = (base: string): string => {
  if (getLocale() === "sv") {
    if (base.endsWith("s") || base.endsWith("x"))
      return base; // Måns or Max => Måns and Max
    else return base + "s"; // Adam => Adams
  } else {
    if (base.endsWith("s"))
      return base + "'"; // Måns => Måns'
    else return base + "'s"; // Adam => Adam's
  }
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const { prisma } = locals;

    let searchId = params.positionId;
    if (!params.positionId.startsWith("dsek." + params.shortName)) {
      searchId = `dsek.${params.shortName}.${params.positionId}`;
    }

    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    switch (getLocale()) {
      case "sv":
        await prisma.position.update({
          where: { id: searchId },
          data: {
            nameSv: form.data.name,
            descriptionSv: form.data.description,
            email: form.data.email,
          },
        });
        break;
      case "en":
        await prisma.position.update({
          where: { id: searchId },
          data: {
            nameEn: form.data.name,
            descriptionEn: form.data.description,
            email: form.data.email,
          },
        });
        break;
    }
    return message(form, {
      message: m.positions_positionUpdated(),
      type: "success",
    });
  },
  addMandate: async ({ params, request, locals }) => {
    const { prisma } = locals;

    let searchId = params.positionId;
    if (!params.positionId.startsWith("dsek." + params.shortName)) {
      searchId = `dsek.${params.shortName}.${params.positionId}`;
    }

    const form = await superValidate(request, zod4(addMandateSchema));
    if (!form.valid) return fail(400, { form });

    const memberNames: string[] | undefined = [];

    form.data.memberIds.forEach(async (id) => {
      const member = await prisma.member.findUnique({ where: { id: id } });
      if (!member)
        return message(
          form,
          { message: m.positions_errors_memberNotFound() },
          { status: 400 },
        );

      await prisma.mandate.create({
        data: {
          positionId: searchId,
          memberId: id,
          startDate: form.data.startDate,
          endDate: form.data.endDate,
          lastSynced: new Date("1970"),
        },
      });

      memberNames.push(member?.firstName ?? "");
    });
    return message(form, {
      message: m.positions_newMandateGivenTo({
        name:
          memberNames.length > 0
            ? memberNames.map((n, i) =>
                i == memberNames.length - 1 ? n : n + ", ",
              )
            : m.positions_theMember(),
      }),
      type: "success",
    });
  },
  updateMandate: async (event) => {
    const { params, request, locals } = event;
    const { prisma } = locals;

    let searchId = params.positionId;
    if (!params.positionId.startsWith("dsek." + params.shortName)) {
      searchId = `dsek.${params.shortName}.${params.positionId}`;
    }

    const form = await superValidate(request, zod4(updateMandateSchema));
    if (!form.valid) return fail(400, { form });
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
        { message: m.positions_errors_mandateNotFound(), type: "error" },
        { status: 400 },
      );
    await prisma.mandate.update({
      where: { id: form.data.mandateId, positionId: searchId },
      data: {
        startDate: form.data.startDate,
        endDate: form.data.endDate,
      },
    });
    throw redirect(
      `/committees/${params.shortName}/position/${searchId}`,
      {
        message: m.positions_mandateUpdated({
          names: genitiveCase(member.firstName ?? m.positions_theMember()),
        }),
        type: "success",
      },
      event,
    );
  },
  deleteMandate: async ({ params, request, locals }) => {
    const { prisma } = locals;

    let searchId = params.positionId;
    if (!params.positionId.startsWith("dsek." + params.shortName)) {
      searchId = `dsek.${params.shortName}.${params.positionId}`;
    }

    const form = await superValidate(request, zod4(deleteMandateSchema));
    if (!form.valid) return fail(400, { form });
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
        { message: m.positions_errors_mandateNotFound(), type: "error" },
        { status: 400 },
      );
    await prisma.mandate.delete({
      where: { id: form.data.mandateId, positionId: searchId },
    });
    return message(form, {
      message: m.positions_mandateRemoved({
        names: genitiveCase(member.firstName ?? m.positions_theMember()),
      }),
      type: "success",
    });
  },
};
