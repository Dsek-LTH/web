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
import { type Action, error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DOMPurify from "isomorphic-dompurify";
import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

// Extend dayjs with timezone support to handle DST correctly
dayjs.extend(utc);
dayjs.extend(timezone);

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
  const slug = slugify(form.data.titleSv);
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
  eventData.descriptionSv = DOMPurify.sanitize(eventData.descriptionSv);
  eventData.descriptionEn = eventData.descriptionEn
    ? DOMPurify.sanitize(eventData.descriptionEn)
    : eventData.descriptionEn;

  if (isRecurring) {
    let recurType: RecurringType;
    if (isRecurringType(recurringType)) {
      recurType = recurringType;
    } else {
      throw error(500);
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
    const events: Array<{ start: Date; end: Date }> = [];

    // Parse dates in correct timezone to handle DST correctly
    const dayjsEndDate = dayjs.tz(
      form.data.recurringEndDatetime,
      "Europe/Stockholm",
    );
    const startDateTz = dayjs.tz(form.data.startDatetime, "Europe/Stockholm");
    const endDateTz = dayjs.tz(form.data.endDatetime, "Europe/Stockholm");

    // Extract time components from the original event to preserve wall clock time
    const startHour = startDateTz.hour();
    const startMinute = startDateTz.minute();
    const endHour = endDateTz.hour();
    const endMinute = endDateTz.minute();

    let currentDate = startDateTz;

    while (
      currentDate.isBefore(dayjsEndDate, "day") ||
      currentDate.isSame(dayjsEndDate, "day")
    ) {
      // Reconstruct the time in Europe/Stockholm timezone to maintain wall clock time across DST
      const eventStart = dayjs
        .tz(currentDate.format("YYYY-MM-DD"), "Europe/Stockholm")
        .hour(startHour)
        .minute(startMinute)
        .toDate();

      const eventEnd = dayjs
        .tz(currentDate.format("YYYY-MM-DD"), "Europe/Stockholm")
        .hour(endHour)
        .minute(endMinute)
        .toDate();

      events.push({ start: eventStart, end: eventEnd });
      currentDate = currentDate.add(
        form.data.separationCount + 1,
        incrementType,
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const event of events) {
        await tx.event.create({
          data: {
            ...eventData,
            recurringParentId: recurringEventParent.id,
            startDatetime: event.start,
            isDetatched: false,
            authorId: user?.memberId ?? error(500, "No user"),
            endDatetime: event.end,
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
      `/events/${slugWithCount(slug, slugCount - events.length)}`, // first one created
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

  eventData.descriptionSv = DOMPurify.sanitize(eventData.descriptionSv);
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
    throw error(404, m.events_errors_eventNotFound());
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
        startDatetime: editType === "FUTURE"
          ? { gte: existingEvent.startDatetime }
          : undefined,
      },
    });

    // Parse dates in Europe/Stockholm timezone to handle DST correctly
    const newStartTz = dayjs.tz(eventData.startDatetime, "Europe/Stockholm");
    const newEndTz = dayjs.tz(eventData.endDatetime, "Europe/Stockholm");

    // Extract new time components to preserve wall clock time across DST
    const newStartHour = newStartTz.hour();
    const newStartMinute = newStartTz.minute();
    const newEndHour = newEndTz.hour();
    const newEndMinute = newEndTz.minute();

    await Promise.all(
      eventsToBeUpdated.map((e) => {
        const {
          startDatetime,
          endDatetime,
          id,
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
           * To avoid lint complaining about unused vars
           **/
          title,
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
           * To avoid lint complaining about unused vars
           **/
          description,
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
           * To avoid lint complaining about unused vars
           **/
          shortDescription,
          ...oldData
        } = e;

        // If times are being changed, reconstruct with new time components to preserve wall clock time
        const eventStartTz = dayjs.tz(startDatetime, "Europe/Stockholm");
        const eventEndTz = dayjs.tz(endDatetime, "Europe/Stockholm");

        const newStartDatetime = dayjs
          .tz(eventStartTz.format("YYYY-MM-DD"), "Europe/Stockholm")
          .hour(newStartHour)
          .minute(newStartMinute)
          .format();

        const newEndDatetime = dayjs
          .tz(eventEndTz.format("YYYY-MM-DD"), "Europe/Stockholm")
          .hour(newEndHour)
          .minute(newEndMinute)
          .format();

        const newData = {
          ...oldData,
          ...eventData,
          startDatetime: newStartDatetime,
          endDatetime: newEndDatetime,
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
