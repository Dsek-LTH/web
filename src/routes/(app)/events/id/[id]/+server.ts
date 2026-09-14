import { eventLink } from "$lib/events/events";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import { error, redirect } from "@sveltejs/kit";

/**
 * This endpoint is a backup in case an event doesn't have a slug.
 * It will create a slug and then redirect to /events/<slug>.
 */
export const GET = async ({ params, locals }) => {
  const id = params.id;
  // Use the policy-enforced client for the read so removed events (which
  // the normal /events/[slug] page also hides) aren't exposed via this
  // fallback lookup.
  const event = await locals.prisma.event.findUnique({
    where: {
      id,
    },
  });
  if (!event) {
    throw error(404, "Event not found");
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
