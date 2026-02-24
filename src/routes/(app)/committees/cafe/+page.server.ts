import type { PageServerLoad, Actions } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { committeeActions, committeeLoad } from "../committee.server";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { TimeSlot } from "@prisma/client";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { updateSchema } from "../types";

import dayjs from "dayjs";

import weekYear from "dayjs/plugin/weekYear";
import weekOfYear from "dayjs/plugin/weekOfYear";

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
  ciabatta: z.string(),
})

export type ShiftWithWorker = {
  id: string;
  date: Date;
  timeSlot: TimeSlot;
  worker: {
    firstName: string;
    lastName: string;
    nickname: string | null;
    studentId: string;
  };
};

export type Ciabatta = {
  id: string;
  year: number;
  week: number;
  ciabatta: string;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const weekShift = Number(
    url.searchParams.get("week") ?? dayjs().startOf("week").week(),
  );

  const { prisma } = locals;
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

  const targetWeek = dayjs()
    .startOf("year")
    .add(weekShift - 1, "week");

  const shifts = prisma.cafeShift.findMany({
    where: {
      date: {
        gte: targetWeek.startOf("week").toDate(),
        lte: targetWeek.endOf("week").toDate(),
      },
    },
    include: {
      worker: {
        select: {
          firstName: true,
          lastName: true,
          nickname: true,
          studentId: true,
        },
      },
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
    weekShift,
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
    //TODO: Maybe make this a message too?
    if (!form.valid) return fail(400, { form });

    const { date, worker, timeSlot } = form.data;

    if (date && timeSlot) {
      const member = worker || user.studentId;
      if (!member) {
        //TODO: These don't seem to do a lot, take a look and fix:
        return fail(400, { form });
      }
      // TODO: check for permissions here so we don't fail
      const cafeShift = await prisma.cafeShift.findFirst({
        where: { date: date, timeSlot: timeSlot },
        include: { worker: { select: { studentId: true } } },
      });
      const isDayManager = isAuthorized(apiNames.CAFE.DAY_MANAGER, user);
      if (!cafeShift) {
        if (timeSlot == TimeSlot.DAYMANAGER && !isDayManager) {
          //TODO: ERROR here
          return message(form, {
            message: "only day managers can sign up there",
            type: "error",
          });
        }
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
      } else {
        // There is already a shift and we might be able to delete it:
        if (cafeShift.worker.studentId === user.studentId) {
          await prisma.cafeShift.delete({ where: { id: cafeShift.id } });
          return message(form, {
            message: m.cafe_quit_shift(),
            type: "success",
          });
        } else {
          //TODO: ERROR here
          return message(form, {
            message: "something went wrong!",
            type: "error",
          });
        }
      }

      return message(form, {
        //TODO: fix this to be it's own translation string
        message: m.cafe_signed_up(),
        type: "success",
      });
    } else {
      //TODO: These don't seem to do a lot, take a look and fix:
      return fail(400, { form });
    }
  },


  // TODO: make this two tables, one look up table,
  // and a second table with two ciabattas
  // (this one we're indexing in here).
  editWeeklyCiabatta: async ({ request, locals }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(editWeeklyCiabattaSchema))
    if (!form.valid) return fail(400, { form });
    if (!isAuthorized(apiNames.CAFE.EDIT_CIABATTAS, user)) return fail(405, { form });
    await prisma.ciabattaOfTheWeek.upsert({
      where: {
        year_week: {
          year: form.data.year,
          week: form.data.week
        },
      },
      update: {
        ciabatta: form.data.ciabatta,
      },
      create: {
        year: form.data.year,
        week: form.data.week,
        ciabatta: form.data.ciabatta
      },
    });
    return message(form, {
      message: "success!",
      type: "success",
    });
  },
};
