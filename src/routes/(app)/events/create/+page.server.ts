import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import dayjs from "dayjs";
import {
  getIncrementType,
  isRecurringType,
  type RecurringType,
} from "$lib/utils/events";

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { prisma } = locals;
  const allTags = await prisma.tag.findMany();
  const { member } = await parent();
  return {
    allTags,
    form: await superValidate(
      { organizer: `${member!.firstName} ${member!.lastName}` },
      eventSchema,
    ),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const slug = slugify(form.data.title);
    const recurringSlugCount = await prisma.recurringEvent.count({
      where: {
        slug: {
          startsWith: slug,
        },
      },
    });
    let slugCount =
      recurringSlugCount +
      (await prisma.event.count({
        where: {
          slug: {
            startsWith: slug,
          },
        },
      }));
    const tagIds = form.data.tags
      .filter((tag) => !!tag)
      .map((tag) => ({
        id: tag.id,
      }));

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    const { isRecurring, recurringEndDatetime, ...recurringEventData } =
      form.data;

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    const { recurringType, separationCount, tags, ...eventData } =
      recurringEventData;

    if (form.data.isRecurring) {
      let recurType: RecurringType;
      const inputRecurringType = form.data.recurringType;
      if (isRecurringType(inputRecurringType)) {
        recurType = inputRecurringType;
      } else {
        error(500);
      }
      const recurringEventParent = await prisma.recurringEvent.create({
        data: {
          ...recurringEventData,
          slug: slugWithCount(slug, slugCount),
          recurringType: recurType,
          endDatetime: form.data.recurringEndDatetime,
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

      //await prisma.event.createMany(events);
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
