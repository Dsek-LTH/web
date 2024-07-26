import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { eventSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import dayjs from "dayjs";
import {
  getIncrementType,
  isRecurringType,
  type RecurringType,
} from "$lib/utils/events";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, member } = locals;
  const allTags = await prisma.tag.findMany();
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");
  return {
    allTags,
    form: await superValidate(
      { organizer: `${member.firstName} ${member.lastName}` },
      zod(eventSchema),
    ),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, zod(eventSchema));
    if (!form.valid) return fail(400, { form });
    const {
      recurringType,
      separationCount,
      tags,
      isRecurring,
      recurringEndDatetime,
      ...eventData
    } = form.data;
    const slug = slugify(form.data.title);
    let slugCount = await prisma.event.count({
      where: {
        slug: {
          startsWith: slug,
        },
      },
    });
    const tagIds = tags
      .filter((tag) => !!tag)
      .map((tag) => ({
        id: tag.id,
      }));

    if (isRecurring) {
      let recurType: RecurringType;
      if (isRecurringType(recurringType)) {
        recurType = recurringType;
      } else {
        error(500);
      }
      const recurringEventParent = await prisma.recurringEvent.create({
        data: {
          startDatetime: eventData.startDatetime,
          recurringType: recurType,
          endDatetime: recurringEndDatetime,
          author: {
            connect: {
              studentId: user?.studentId,
            },
          },
          separationCount: separationCount,
        },
      });
      slugCount += 1;

      const incrementType: dayjs.ManipulateType = getIncrementType(recurType);
      const dates: Date[] = [];
      const dayjsEndDate = dayjs(form.data.recurringEndDatetime);
      let date = dayjs(form.data.startDatetime);
      const startEndDiff = dayjs(form.data.endDatetime).diff(date);
      while (
        date.isBefore(dayjsEndDate, "day") ||
        date.isSame(dayjsEndDate, "day")
      ) {
        dates.push(date.toDate());
        date = date.add(form.data.separationCount + 1, incrementType);
      }

      dates.forEach(async (date) => {
        slugCount += 1;
        await prisma.event.create({
          data: {
            ...eventData,
            recurringParentId: recurringEventParent.id,
            startDatetime: date,
            isDetatched: false,
            authorId: user?.memberId ?? error(500, "No user"),
            endDatetime: dayjs(date).add(startEndDiff).toDate(),
            slug: slugWithCount(slug, slugCount),
            tags: {
              connect: tagIds,
            },
          },
        });
      });

      redirect(
        `/events/${slugWithCount(slug, slugCount - 1)}`,
        {
          message: "Evenemang skapat",
          type: "success",
        },
        event,
      );
    } else {
      const result = await prisma.event.create({
        data: {
          slug: slugWithCount(slug, slugCount),
          ...eventData,
          author: {
            connect: {
              studentId: user?.studentId,
            },
          },
          tags: {
            connect: tagIds,
          },
        },
      });

      throw redirect(
        `/events/${result.slug}`,
        {
          message: "Evenemang skapat",
          type: "success",
        },
        event,
      );
    }
  },
};
