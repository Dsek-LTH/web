import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { actionType, eventSchema } from "$lib/events/schema";
import { uploadFile } from "$lib/files/uploadFiles";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import {
  getIncrementType,
  isRecurringType,
  type RecurringType,
} from "$lib/utils/events";
import { z } from "zod";
import { redirect } from "$lib/utils/redirect";
import { slugify, slugWithCount } from "$lib/utils/slugify";
import * as m from "$paraglide/messages";
import { error, type Action } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import dayjs from "dayjs";
import DOMPurify from "isomorphic-dompurify";
import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

const uploadImage = async (user: AuthUser, image: File, slug: string) => {
  const imageUrl = await uploadFile(
    user,
    image,
    `public/events/${slug}`,
    PUBLIC_BUCKETS_FILES,
    "header",
    {
      resize: {
        width: 1920,
      },
    },
  );
  return imageUrl;
};

export const createEvent: Action = async (event) => {
  const { request, locals } = event;
  const { prisma, user } = locals;
  const form = await superValidate(request, zod(eventSchema));
  if (!form.valid) return fail(400, { form });
  const {
    tags,
    image,
    recurringType,
    separationCount,
    isRecurring,
    recurringEndDatetime,
    ...eventData
  } = form.data;
  const slug = slugify(form.data.title);
  // has to be authorized to count all slugs
  let slugCount = await authorizedPrismaClient.event.count({
    where: {
      slug: {
        startsWith: slug,
      },
    },
  });

  if (image) eventData.imageUrl = await uploadImage(user, image, slug);

  const tagIds = tags
    .filter((tag) => !!tag)
    .map((tag) => ({
      id: tag.id,
    }));
  // sanitize
  eventData.description = DOMPurify.sanitize(eventData.description);
  eventData.descriptionEn = eventData.descriptionEn
    ? DOMPurify.sanitize(eventData.descriptionEn)
    : eventData.descriptionEn;

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

    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        await tx.event.create({
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
        slugCount += 1;
      }
    });

    redirect(
      `/events/${slugWithCount(slug, slugCount - dates.length)}`, // first one created
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
};

export const updateEvent: Action<{ slug: string }> = async (event) => {
  const { request, locals, params } = event;
  const { user, prisma } = locals;
  const slug = params.slug;
  const form = await superValidate(
    request,
    zod(eventSchema.and(z.object({ editType: actionType }))),
  );
  if (!form.valid) return fail(400, { form });
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
   * To avoid lint complaining about unused vars
   **/
  const { isRecurring, recurringEndDatetime, ...recurringEventData } =
    form.data;

  const {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    recurringType,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    separationCount,
    tags,
    image,
    editType,
    ...eventData
  } = recurringEventData;

  eventData.description = DOMPurify.sanitize(eventData.description);
  eventData.descriptionEn = eventData.descriptionEn
    ? DOMPurify.sanitize(eventData.descriptionEn)
    : eventData.descriptionEn;
  const existingEvent = await prisma.event.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      recurringParentId: true,
      startDatetime: true,
      endDatetime: true,
    },
  });
  if (!existingEvent) {
    error(404, m.events_errors_eventNotFound());
  }

  if (image) eventData.imageUrl = await uploadImage(user, image, slug);

  if (!isRecurring || editType === "THIS") {
    await prisma.event.update({
      where: {
        id: existingEvent.id,
      },
      data: {
        ...eventData,
        author: undefined,
        tags: {
          set: tags.map(({ id }) => ({ id })),
        },
      },
    });
  } else if (editType === "FUTURE" || editType === "ALL") {
    const eventsToBeUpdated = await prisma.event.findMany({
      where: {
        recurringParentId: existingEvent.recurringParentId,
        startDatetime:
          editType === "FUTURE"
            ? { gte: existingEvent.startDatetime }
            : undefined,
      },
    });

    const startTimeDiff = dayjs(eventData.startDatetime).diff(
      dayjs(existingEvent.startDatetime),
    );
    const endTimeDiff = dayjs(eventData.endDatetime).diff(
      dayjs(existingEvent.endDatetime),
    );

    await Promise.all(
      eventsToBeUpdated.map((e) => {
        const { startDatetime, endDatetime, id, ...oldData } = e;
        const newData = {
          ...oldData,
          ...eventData,
          startDatetime: dayjs(startDatetime).add(startTimeDiff, "ms").format(),
          endDatetime: dayjs(endDatetime).add(endTimeDiff, "ms").format(),
          author: undefined,
          tags: {
            set: tags.map(({ id }) => ({ id })),
          },
        };
        return prisma.event.update({
          where: {
            id: id,
          },
          data: {
            ...newData,
          },
        });
      }),
    );
  }

  throw redirect(
    `/events/${slug}`,
    {
      message: m.events_eventUpdated(),
      type: "success",
    },
    event,
  );
};
