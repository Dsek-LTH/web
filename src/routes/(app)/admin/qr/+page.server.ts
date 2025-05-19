import { BASIC_EVENT_FILTER } from "$lib/events/events";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma, user } = locals;
  authorize(apiNames.EVENT.READ, user);

  // Get page number from URL query params (default to 1)
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 12;

  // Calculate pagination values
  const skip = (page - 1) * pageSize;

  // Get total count for pagination
  const totalEvents = await prisma.event.count({
    where: {
      ...BASIC_EVENT_FILTER(),
    },
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalEvents / pageSize);

  // Fetch paginated events
  const events = await prisma.event.findMany({
    where: {
      ...BASIC_EVENT_FILTER(),
    },
    orderBy: {
      startDatetime: "desc",
    },
    skip,
    take: pageSize,
    include: {
      tags: true,
      going: {
        select: {
          id: true,
        },
      },
      interested: {
        select: {
          id: true,
        },
      },
      author: true,
    },
  });

  return {
    events,
    pagination: {
      currentPage: page,
      totalPages,
      totalEvents,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const actions = {
  async selectEvent({ request }) {
    const formData = await request.formData();
    const eventSlug = formData.get("eventSlug")?.toString();

    if (!eventSlug) {
      return { success: false, message: "No event slug provided" };
    }

    // Redirect to the event's QR page
    throw redirect(303, `/events/${eventSlug}/scan`);
  },
};
