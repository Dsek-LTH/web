import type { PageServerLoad, Actions } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import * as m from "$paraglide/messages";
import { fail, } from "@sveltejs/kit";
import { TimeSlot } from "@prisma/client";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { updateSchema, } from "../types";


import dayjs from "dayjs";

import weekYear from "dayjs/plugin/weekYear";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

const scheduleForm = z.object({
  date: z.date(),
  worker: z.string().optional(),
  timeSlot: z.nativeEnum(TimeSlot)
})

const weekForm = z.object({ week: z.number() })


export type ShiftWithWorker = {
  id: string;
  date: Date;
  timeSlot: TimeSlot,
  worker: {
    firstName: string;
    lastName: string;
    nickname: string | null;
    studentId: string;
  }
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const weekShift = Number(url.searchParams.get('week') ?? 0);

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

  const targetWeek = dayjs().add(weekShift, "week");
  const shifts = prisma.cafeShift.findMany({
    where: {
      date: {
        gte: targetWeek.startOf('week').toDate(),
        lte: targetWeek.endOf('week').toDate()
      }
    },
    include: {
      worker: {
        select: {
          firstName: true,
          lastName: true,
          nickname: true,
          studentId: true
        },
      },
    },
    orderBy: { date: 'asc' }
  });

  return committeeLoad(prisma, "cafe", url).then(async (data) => ({
    ...data,
    openingHours: await openingHours,
    shifts: await shifts as ShiftWithWorker[],
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
    const form = await superValidate(request, zod(scheduleForm))
    //TODO: Maybe make this a message too?
    if (!form.valid) return fail(400, { form });

    const { date, worker, timeSlot } = form.data;

    if (date && timeSlot) {
      const member = worker || user.studentId
      if (!member) {
        return fail(400, { form });
      }
      // TODO: check for permissions here so we don't fail
      const cafeShift = await prisma.cafeShift.findFirst({ where: { date: date, timeSlot: timeSlot }, })
      if (!cafeShift) {
        await prisma.cafeShift.create({
          data: {
            date: date,
            worker: {
              connect: {
                studentId: member,
              }
            },
            timeSlot: timeSlot
          },
        })
      }

      return message(form, {
        //TODO: fix this to be it's own translation string
        message: m.songbook_songUpdated(),
        type: "success",
      })

    } else {
      return fail(400, { form });
    }
  },

  //TODO: Make this update live and change weekShift from CafeBookingCalendar!
  changeWeek: async ({ request, }) => {
    const form = await superValidate(request, zod(weekForm))
    if (!form.valid) return fail(400, { form });

    const week = Number(form.data.week);
    return { week }
  }
};
