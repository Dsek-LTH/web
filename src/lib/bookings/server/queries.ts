import dayjs from "dayjs";
import { error, type RequestEvent } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { bookingSchema } from "$lib/bookings/schema";
import type { components } from "$lib/api/schema";
import { searchDocumentId } from "$lib/search/searchHelpers";
import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
import { serverApi } from "$lib/server/apiClient";
import { APP_TIMEZONE } from "$lib/utils/datetime";

type GoBookingRequest = components["schemas"]["BookingRequest"];
type Member = components["schemas"]["Member"];
type BookingStatus = "ACCEPTED" | "PENDING" | "DENIED";

/**
 * A Go booking request in the shape the booking pages render: dates as
 * Dates, lists never null, status as its enum.
 */
export const normalizeBooking = (booking: GoBookingRequest) => ({
  ...booking,
  start: booking.start ? new Date(booking.start) : null,
  end: booking.end ? new Date(booking.end) : null,
  created: booking.created ? new Date(booking.created) : null,
  event: booking.event ?? null,
  status: booking.status as BookingStatus,
  booker: booking.booker ?? null,
  bookables: booking.bookables ?? [],
  accessDoors: booking.accessDoors ?? [],
  accessMembers: booking.accessMembers ?? [],
});
export type BookingRequest = ReturnType<typeof normalizeBooking>;

/** A booking request from Go, or a 404. */
export async function getBookingRequestOrThrow(
  event: RequestEvent,
  id: string,
) {
  const res = await serverApi(event).GET("/booking-requests/{id}", {
    params: { path: { id } },
  });
  if (res.error) error(404, m.booking_errors_notFound());
  return normalizeBooking(res.data);
}

/** Every booking request from a week back onwards, soonest first. */
export async function getUpcomingBookingRequests(event: RequestEvent) {
  const res = await serverApi(event).GET("/booking-requests", {});
  return (res.data ?? []).map(normalizeBooking);
}

/** Everything the booking form needs to pick from: bookables and doors. */
export async function getBookingFormOptions(event: RequestEvent) {
  const api = serverApi(event);
  const [bookablesRes, doorsRes] = await Promise.all([
    api.GET("/bookables", {}),
    api.GET("/booking-requests/doors", {}),
  ]);
  return {
    bookables: bookablesRes.data ?? [],
    doors: doorsRes.data ?? [],
  };
}

/** The booking form, filled in from an existing request. */
export function getSuperValidatedBookingForm(booking: BookingRequest) {
  const initialData = {
    name: booking.event ?? undefined,
    start: booking.start
      ? dayjs(booking.start).tz(APP_TIMEZONE).format("YYYY-MM-DDTHH:mm")
      : undefined,
    end: booking.end
      ? dayjs(booking.end).tz(APP_TIMEZONE).format("YYYY-MM-DDTHH:mm")
      : undefined,
    bookables: booking.bookables.map((bookable) => bookable.id),
    accessDoors: booking.accessDoors.map((door) => door.name),
    accessMemberIds: booking.accessMembers.map((member) => member.id),
  };

  return superValidate(initialData, zod4(bookingSchema));
}

/**
 * Converts a member to the shape MemberSelector expects, encoding the id
 * the same way the member search index does so MemberSelector can decode it.
 */
export function toMemberSearchAttributes(
  member: Member,
): MemberSearchReturnAttributes & { id: string } {
  return {
    id: searchDocumentId(member.id),
    firstName: member.firstName ?? null,
    lastName: member.lastName ?? null,
    nickname: member.nickname ?? null,
    studentId: member.studentId ?? null,
    picturePath: member.picturePath ?? null,
    classYear: member.classYear ?? null,
    classProgramme: member.classProgramme ?? null,
    fullName: `${member.firstName ?? ""} ${member.lastName ?? ""}`,
  };
}

/** A form's Stockholm wall-clock "YYYY-MM-DDTHH:mm" as an ISO instant. */
export const stockholmToIso = (value: string) =>
  dayjs.tz(value, APP_TIMEZONE).toISOString();
