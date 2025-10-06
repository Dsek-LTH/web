import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import {
  message,
  setError,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import authentik from "$lib/server/authentik";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { languageTag } from "$paraglide/runtime";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const { prisma } = locals;
  const position = await prisma.position.findUnique({
    where: {
      id: params.id,
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
  if (!position) {
    throw error(404, m.positions_errors_positionNotFound());
  }
  const editedMandateID = url.searchParams.get("editMandate");
  const editedMandate = position.mandates.find((m) => m.id === editedMandateID);
  return {
    updateForm: superValidate(position, zod(updateSchema)),
    addMandateForm: superValidate(zod(addManadateSchema)),
    updateMandateForm: editedMandate
      ? superValidate(editedMandate, zod(updateMandateSchema))
      : superValidate(zod(updateMandateSchema)),
    deleteMandateForm: superValidate(zod(deleteMandateSchema)),
    position,
    mandates: position.mandates,
  };
};

const updateSchema = z.object({
  nameSv: z.string().optional(),
  descriptionSv: z.string().nullable(),
  email: z.string().email().nullable(),
});
export type UpdatePositionSchema = Infer<typeof updateSchema>;

const END_OF_YEAR = new Date(`${new Date().getFullYear()}-12-31T23:59:59`);

const addManadateSchema = z.object({
  memberId: z.string().uuid(),
  startDate: z.coerce.date().default(new Date()),
  endDate: z.coerce.date().default(END_OF_YEAR),
});
export type AddMandateSchema = Infer<typeof addManadateSchema>;

const updateMandateSchema = z.object({
  mandateId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateMandateSchema = Infer<typeof updateMandateSchema>;

const deleteMandateSchema = z.object({
  mandateId: z.string().uuid(),
});
export type DeleteMandateSchema = Infer<typeof deleteMandateSchema>;

const genitiveCase = (base: string): string => {
  if (languageTag() === "sv") {
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
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    switch (languageTag()) {
      case "sv":
        await prisma.position.update({
          where: { id: params.id },
          data: {
            nameSv: form.data.nameSv,
            descriptionSv: form.data.descriptionSv,
            email: form.data.email,
          },
        });
        break;
      case "en":
        await prisma.position.update({
          where: { id: params.id },
          data: {
            nameEn: form.data.nameSv,
            descriptionEn: form.data.descriptionSv,
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
    const form = await superValidate(request, zod(addManadateSchema));
    if (!form.valid) return fail(400, { form });
    const member = await prisma.member.findUnique({
      where: { id: form.data.memberId },
    });
    if (!member)
      return setError(form, "memberId", m.positions_errors_memberNotFound());
    const createdMandate = await prisma.mandate.create({
      data: {
        positionId: params.id,
        memberId: form.data.memberId,
        startDate: form.data.startDate,
        endDate: form.data.endDate,
        lastSynced: new Date("1970"),
      },
    });
    authentik.fetchGroupsAddMandate(
      prisma,
      member.studentId!,
      params.id,
      createdMandate.id,
    );
    return message(form, {
      message: m.positions_newMandateGivenTo({
        name: member.firstName ?? m.positions_theMember(),
      }),
      type: "success",
    });
  },
  updateMandate: async (event) => {
    const { params, request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateMandateSchema));
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
      where: { id: form.data.mandateId, positionId: params.id },
      data: {
        startDate: form.data.startDate,
        endDate: form.data.endDate,
      },
    });
    throw redirect(
      `/positions/${params.id}`,
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
    const form = await superValidate(request, zod(deleteMandateSchema));
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
      where: { id: form.data.mandateId, positionId: params.id },
    });
    authentik.fetchGroupsDeleteMandate(
      prisma,
      member.studentId!,
      params.id,
      form.data.mandateId,
    );
    return message(form, {
      message: m.positions_mandateRemoved({
        names: genitiveCase(member.firstName ?? m.positions_theMember()),
      }),
      type: "success",
    });
  },
};
