import { error, fail } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad, RouteParams } from "./$types";
import * as m from "$paraglide/messages";
import { getLocale } from "$paraglide/runtime";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { redirect } from "sveltekit-flash-message/server";
import {
  committeeToPositionMap,
  getPositionLink,
  positionPrefixes,
} from "$lib/utils/positions";

dayjs.extend(utc);

const getLocalSearchId = (params: RouteParams) => {
  if (!positionPrefixes.some((v) => params.positionId.includes(v))) {
    return `dsek.${committeeToPositionMap[params.shortName as keyof typeof committeeToPositionMap]}.${params.positionId}`;
  }
  return params.positionId;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
  const searchId = getLocalSearchId(params);
  const res = await api.GET("/positions/{id}", {
    fetch,
    params: { path: { id: searchId } },
  });
  if (res.error) {
    throw error(404, m.positions_errors_positionNotFound());
  }
  const position = res.data;

  const mandates = (position.mandates ?? []).map((mandate) => ({
    ...mandate,
    startDate: new Date(mandate.startDate!),
    endDate: new Date(mandate.endDate!),
    member: mandate.member!,
  }));

  //Logic for startMonth and endMonth that can wrap over new years

  //If the mandateperiod is within a year the endMonth will be greater than the startMonth which gives the difference:
  //(position.endMonth - position.startMonth) to be added.

  //If the mandateperiod wraps into a new year (and is a year or less) the endMonth will be smaller than the startMonth.
  //The months that need to be added in this case is a full year minus the difference between the months:
  //12 - Math.abs(position.endMonth - position.startMonth)

  const startMonth = position.startMonth ?? 0;
  const endMonth = position.endMonth ?? 11;
  const addMandateMonthDifference =
    endMonth > startMonth ? endMonth - startMonth : 12 - Math.abs(endMonth - startMonth);

  return {
    updateForm: superValidate(
      {
        name: position.name,
        description: position.description ?? null,
        email: position.email ?? null,
      },
      zod4(updateSchema),
    ),
    addMandateForm: superValidate(zod4(addMandateSchema), {
      defaults: {
        memberIds: [],
        startDate: dayjs().month(startMonth).utc().startOf("month").toDate(),
        endDate: dayjs()
          .month(startMonth)
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
    mandates,
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

const toDateString = (d: Date) => d.toISOString().split("T")[0]!;

export const actions: Actions = {
  update: async ({ params, request, fetch }) => {
    const searchId = getLocalSearchId(params);

    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });

    // Full-replace: fetch the current position so the locale not being
    // edited right now keeps its existing value instead of being cleared.
    const currentRes = await api.GET("/positions/{id}", {
      fetch,
      params: { path: { id: searchId } },
    });
    if (currentRes.error) return fail(404, { form });
    const current = currentRes.data;

    const isSv = getLocale() === "sv";
    const res = await api.PATCH("/positions/{id}", {
      fetch,
      params: { path: { id: searchId } },
      body: {
        nameSv: isSv ? (form.data.name ?? "") : (current.nameSv ?? ""),
        nameEn: isSv ? current.nameEn : form.data.name,
        descriptionSv: isSv
          ? (form.data.description ?? undefined)
          : current.descriptionSv,
        descriptionEn: isSv
          ? current.descriptionEn
          : (form.data.description ?? undefined),
        email: form.data.email ?? undefined,
        active: current.active ?? true,
        boardMember: current.boardMember ?? false,
      },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.positions_positionUpdated(),
      type: "success",
    });
  },
  addMandate: async ({ params, request, fetch }) => {
    const searchId = getLocalSearchId(params);

    const form = await superValidate(request, zod4(addMandateSchema));
    if (!form.valid) return fail(400, { form });

    const res = await api.POST("/positions/{positionId}/mandates", {
      fetch,
      params: { path: { positionId: searchId } },
      body: {
        memberIds: form.data.memberIds,
        startDate: toDateString(form.data.startDate),
        endDate: toDateString(form.data.endDate),
      },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.positions_newMandateGivenTo({
        name: m.positions_theMember(),
      }),
      type: "success",
    });
  },
  updateMandate: async (event) => {
    const { params, request, fetch } = event;
    const searchId = getLocalSearchId(params);

    const form = await superValidate(request, zod4(updateMandateSchema));
    if (!form.valid) return fail(400, { form });
    if (!form.data.startDate || !form.data.endDate) return fail(400, { form });

    const res = await api.PATCH("/mandates/{id}", {
      fetch,
      params: { path: { id: form.data.mandateId } },
      body: {
        startDate: toDateString(form.data.startDate),
        endDate: toDateString(form.data.endDate),
      },
    });
    if (res.error)
      return message(
        form,
        { message: m.positions_errors_mandateNotFound(), type: "error" },
        { status: 400 },
      );

    // Unlike the old Prisma version, this doesn't personalize the flash
    // message with the member's name - Go has no "get a single mandate"
    // lookup, and fetching the whole position again just for a display
    // string wasn't worth the extra round-trip.
    throw redirect(
      getPositionLink(searchId),
      {
        message: m.positions_mandateUpdated({
          names: m.positions_theMember(),
        }),
        type: "success",
      },
      event,
    );
  },
  deleteMandate: async ({ request, fetch }) => {
    const form = await superValidate(request, zod4(deleteMandateSchema));
    if (!form.valid) return fail(400, { form });

    const res = await api.DELETE("/mandates/{id}", {
      fetch,
      params: { path: { id: form.data.mandateId } },
    });
    if (res.error)
      return message(
        form,
        { message: m.positions_errors_mandateNotFound(), type: "error" },
        { status: 400 },
      );

    return message(form, {
      message: m.positions_mandateRemoved({
        names: m.positions_theMember(),
      }),
      type: "success",
    });
  },
};
