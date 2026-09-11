import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { bookingSchema } from "$lib/bookings/schema";
import { prismaIdToMeiliId } from "$lib/search/searchHelpers";
import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

dayjs.extend(utc);
dayjs.extend(timezone);

export type BookingRequestWithRelations =
  ExtendedPrismaModel<"BookingRequest"> & {
    bookables: Array<ExtendedPrismaModel<"Bookable">>;
    booker: ExtendedPrismaModel<"Member"> | null;
    accessDoors: Array<ExtendedPrismaModel<"Door">>;
    accessMembers: Array<ExtendedPrismaModel<"Member">>;
  };

export async function getUpcomingBookingRequests(prisma: ExtendedPrisma) {
  return prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
      accessDoors: true,
      accessMembers: true,
    },
  });
}

export async function getBookingRequestOrThrow(
  prisma: ExtendedPrisma,
  id: string,
) {
  return prisma.bookingRequest
    .findUniqueOrThrow({
      where: { id },
      include: {
        bookables: true,
        booker: true,
        accessDoors: true,
        accessMembers: true,
      },
    })
    .catch(() => {
      throw error(404, m.booking_errors_notFound());
    });
}

export async function getSuperValidatedBookingForm(
  bookingRequest: ExtendedPrismaModel<"BookingRequest"> & {
    bookables: Array<ExtendedPrismaModel<"Bookable">>;
    accessDoors?: Array<ExtendedPrismaModel<"Door">>;
    accessMembers?: Array<ExtendedPrismaModel<"Member">>;
  },
) {
  const initialData = {
    name: bookingRequest.event ?? undefined,
    start: bookingRequest.start
      ? dayjs(bookingRequest.start)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DDTHH:mm")
      : undefined,
    end: bookingRequest.end
      ? dayjs(bookingRequest.end)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DDTHH:mm")
      : undefined,
    bookables: bookingRequest.bookables?.map((bookable) => bookable.id),
    accessDoors: bookingRequest.accessDoors?.map((door) => door.name) ?? [],
    accessMemberIds:
      bookingRequest.accessMembers?.map((member) => member.id) ?? [],
  };

  return superValidate(initialData, zod4(bookingSchema));
}

/**
 * Converts a member row to the shape MemberSelector expects, encoding the id
 * the same way the member search index does so MemberSelector can decode it.
 */
export function toMemberSearchAttributes(
  member: Pick<
    ExtendedPrismaModel<"Member">,
    | "id"
    | "firstName"
    | "lastName"
    | "nickname"
    | "studentId"
    | "picturePath"
    | "classYear"
    | "classProgramme"
  >,
): MemberSearchReturnAttributes & { id: string } {
  return {
    ...member,
    id: prismaIdToMeiliId(member.id),
    fullName: `${member.firstName} ${member.lastName}`,
  };
}
