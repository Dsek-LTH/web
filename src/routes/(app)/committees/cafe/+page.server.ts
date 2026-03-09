import type { PageServerLoad, Actions } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { committeeActions, committeeLoad } from "../committee.server";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import { Prisma, TimeSlot } from "@prisma/client";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { updateSchema } from "../types";

import dayjs from "dayjs";

import weekYear from "dayjs/plugin/weekYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { AuthUser } from "@zenstackhq/runtime";

dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

const scheduleForm = z.object({
  date: z.date(),
  worker: z.string().optional(),
  timeSlot: z.nativeEnum(TimeSlot),
});

const editWeeklyCiabattaSchema = z.object({
  year: z.number(),
  week: z.number(),
  name: z.string(),
});

export type ShiftWithWorker = Prisma.CafeShiftGetPayload<{
  include: { worker: true };
}>;

function getWeek(weekString: string | null, user: AuthUser): dayjs.Dayjs {
  const currentWeek = dayjs().startOf("week");
  const weekNum = Number(weekString ?? currentWeek.week());
  if (!isAuthorized(apiNames.CAFE.SEE_ALL_WEEKS, user)) {
    if (weekNum < currentWeek.week() || weekNum > currentWeek.week() + 2) {
      error(403, { message: m.cafe_error_no_week_viewing_perms() });
    }
  }
  return dayjs()
    .startOf("year")
    .add(weekNum - 1, "week");
}

export type Ciabatta = {
  id: string;
  year: number;
  week: number;
  name: string;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, prisma } = locals;

  const targetWeek = getWeek(url.searchParams.get("week"), user);

  const openingHours = prisma.markdown.findMany({
    where: {
      name: {
        startsWith: "cafe:open",
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const shifts = prisma.cafeShift.findMany({
    where: {
      date: {
        gte: targetWeek.startOf("week").toDate(),
        lte: targetWeek.endOf("week").toDate(),
      },
    },
    include: {
      worker: true,
    },
    orderBy: { date: "asc" },
  });

  const ciabattaOfTheWeek = prisma.ciabattaOfTheWeek.findFirst({
    where: {
      year: targetWeek.year(),
      week: targetWeek.week(),
    },
  });

  return committeeLoad(prisma, "cafe", url).then(async (data) => ({
    ...data,
    openingHours: await openingHours,
    shifts: (await shifts) as ShiftWithWorker[],
    ciabattaOfTheWeek: (await ciabattaOfTheWeek) as Ciabatta,
    week: targetWeek.week(),
  }));
};

export const actions: Actions = {
  ...committeeActions("cafe"),
  updateHours: async ({ request, locals }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });

    const { markdownSv, markdownEn, markdownSlug } = form.data;

    if (markdownSlug && markdownSv) {
      await updateMarkdown(user, prisma, {
        name: markdownSlug,
        markdownSv,
        markdownEn,
      });
      return message(form, {
        message: m.committees_committeeUpdated(),
        type: "success",
      });
    } else {
      return fail(400, { form });
    }
  },

  updateSchedule: async ({ request, locals }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(scheduleForm));
    if (!form.valid) return fail(400, { form });

    const { date, worker, timeSlot } = form.data;

    if (date && timeSlot) {
      const member = worker || user.studentId;
      const isSetByAdmin = isAuthorized(apiNames.CAFE.EDIT_WORKERS, user);
      if (member != user.studentId) {
        if (!isAuthorized(apiNames.CAFE.EDIT_WORKERS, user)) {
          return message(form, {
            message: m.cafe_error_no_edit_worker_perms(),
            type: "error",
          });
        }
      }
      if (!member) {
        return fail(400, { form });
      }
      const dayShifts = await prisma.cafeShift.findMany({
        where: { date: date },
        include: { worker: { select: { studentId: true } } },
      });

      const cafeShift = dayShifts.find((shift) => shift.timeSlot == timeSlot);

      const isDayManager = isAuthorized(apiNames.CAFE.DAY_MANAGER, user);
      if (!cafeShift) {
        if (timeSlot == TimeSlot.DAYMANAGER && !isDayManager && !isSetByAdmin) {
          return message(form, {
            message: m.cafe_error_only_daymanagers(),
            type: "error",
          });
        }
        // Check if the user already has a shift
        const tempShift = dayShifts.filter(
          (shift) =>
            shift.timeSlot != timeSlot &&
            shift.worker.studentId == user.studentId,
        );
        if (!isSetByAdmin && tempShift.length === 1) {
          return message(form, {
            message: m.cafe_error_already_have_shift(),
            type: "error",
          });
        }
        try {
          await prisma.cafeShift.create({
            data: {
              date: date,
              worker: {
                connect: {
                  studentId: member,
                },
              },
              timeSlot: timeSlot,
            },
          });
        } catch (error: unknown) {
          // Ugly (but afaik only) way to catch specifically when a valid member studentId isn't passed in.
          // This requires less db calls then first checking the member.
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2025"
          ) {
            return message(form, {
              message: m.cafe_error_worker_not_exist({ name: member }),
              type: "error",
            });
          }
          throw error;
        }
      } else {
        // There is already a shift and we might be able to delete it:
        if (cafeShift.worker.studentId === member) {
          await prisma.cafeShift.delete({ where: { id: cafeShift.id } });
          return message(form, {
            message:
              member === user.studentId
                ? m.cafe_quit_shift()
                : m.cafe_quit_shift_for_other({ name: member }),
            type: "success",
          });
        } else {
          return message(form, {
            message: m.generic_error(),
            type: "error",
          });
        }
      }

      return message(form, {
        message:
          member === user.studentId
            ? m.cafe_signed_up()
            : m.cafe_signed_up_for_other({ name: member }),
        type: "success",
      });
    } else {
      return fail(400, { form });
    }
  },

  editWeeklyCiabatta: async ({ request, locals }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(editWeeklyCiabattaSchema));
    if (!form.valid) return fail(400, { form });
    if (!isAuthorized(apiNames.CAFE.EDIT_CIABATTAS, user)) {
      return message(form, {
        message: m.cafe_error_no_ciabatta_edit_perms(),
        type: "error",
      });
    }
    await prisma.ciabattaOfTheWeek.upsert({
      where: {
        year_week: {
          year: form.data.year,
          week: form.data.week,
        },
      },
      update: {
        name: form.data.name,
      },
      create: {
        year: form.data.year,
        week: form.data.week,
        name: form.data.name,
      },
    });
    return message(form, {
      message: m.cafe_changed_ciabatta(),
      type: "success",
    });
  },
};
