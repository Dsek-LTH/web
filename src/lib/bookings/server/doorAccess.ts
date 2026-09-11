import dayjs from "dayjs";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const BOOKING_DOOR_ACCESS_BUFFER_HOURS = 1;

/** Removes any door access granted because of this booking. */
export async function clearBookingDoorAccess(bookingRequestId: string) {
  await authorizedPrismaClient.doorAccessPolicy.deleteMany({
    where: { bookingRequestId },
  });
}

/**
 * Grants door access for the doors/members requested on an accepted booking,
 * for the booking's time window plus a buffer before and after.
 * Replaces any previously granted access for the same booking.
 */
export async function grantBookingDoorAccess(booking: {
  id: string;
  start: Date | null;
  end: Date | null;
  event: string | null;
  accessDoors: { name: string }[];
  accessMembers: { studentId: string | null }[];
}) {
  await clearBookingDoorAccess(booking.id);

  const studentIds = booking.accessMembers
    .map((member) => member.studentId)
    .filter((studentId): studentId is string => !!studentId);

  if (
    studentIds.length === 0 ||
    booking.accessDoors.length === 0 ||
    !booking.start ||
    !booking.end
  ) {
    return;
  }

  const startDatetime = dayjs(booking.start)
    .subtract(BOOKING_DOOR_ACCESS_BUFFER_HOURS, "hour")
    .toDate();
  const endDatetime = dayjs(booking.end)
    .add(BOOKING_DOOR_ACCESS_BUFFER_HOURS, "hour")
    .toDate();

  await authorizedPrismaClient.doorAccessPolicy.createMany({
    data: booking.accessDoors.flatMap((door) =>
      studentIds.map((studentId) => ({
        doorName: door.name,
        studentId,
        startDatetime,
        endDatetime,
        information: `Booking: ${booking.event ?? booking.id}`,
        bookingRequestId: booking.id,
      })),
    ),
  });
}
