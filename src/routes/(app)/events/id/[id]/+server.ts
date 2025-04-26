import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { eventLink, redirect } from "$lib/utils/redirect";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import { error } from "@sveltejs/kit";

/**
 * This endpoint is a backup in case an event doesn't have a slug.
 * It will create a slug and then redirect to /events/<slug>.
 */
export const GET = async ({ params }) => {
  const id = params.id;
  const event = await authorizedPrismaClient.event.findUnique({
    where: {
      id,
    },
  });
  if (!event) {
    error(404, "Event not found");
  }
  let eventSlug = event?.slug;
  if (eventSlug == null) {
    const slug = slugify(event.title);
    const slugCount = await authorizedPrismaClient.event.count({
      where: {
        slug: {
          startsWith: slug,
        },
      },
    });
    const newSlug = slugWithCount(slug, slugCount);
    await authorizedPrismaClient.event.update({
      where: {
        id,
      },
      data: {
        slug: newSlug,
      },
    });
    eventSlug = newSlug;
  }
  throw redirect(302, eventLink({ id: event.id, slug: eventSlug })); // 308 is permanent redirect
};
