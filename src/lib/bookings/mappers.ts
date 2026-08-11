import { createBookingEvent } from "./createBookingEvent";
import type { BookingCalendarEvent, BookingStatus } from "./eventTypes";

type BookingSource = {
  id: string;
  event: string | null;
  status: BookingStatus;
  start: Date | string | null;
  end: Date | string | null;
  bookables: Array<{
    name?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  }>;
  booker: {
    firstName: string | null;
    lastName: string | null;
    studentId: string | null;
    picturePath: string | null;
  } | null;
};

export const toStockholmTime = (date: Date | string) =>
  Temporal.Instant.from(
    date instanceof Date ? date.toISOString() : date,
  ).toZonedDateTimeISO("Europe/Stockholm");

export const getBookerName = (booking: BookingSource): string => {
  const fullName = [booking.booker?.firstName, booking.booker?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Unknown";
};

export const getBookerInitials = (booking: BookingSource): string => {
  const firstInitial = booking.booker?.firstName?.charAt(0);
  const lastInitial = booking.booker?.lastName?.charAt(0);
  if (firstInitial && lastInitial) return `${firstInitial}${lastInitial}`;
  return "NN";
};

export const getBookingLocation = (booking: BookingSource): string =>
  booking.bookables[0]?.name ??
  booking.bookables[0]?.nameSv ??
  booking.bookables[0]?.nameEn ??
  "Unknown";

export const mapBookingToCalendarEvent = (
  booking: BookingSource,
): BookingCalendarEvent | null => {
  if (!booking.start || !booking.end) return null;

  return createBookingEvent({
    id: booking.id,
    title: booking.event ?? "Booking",
    start: toStockholmTime(booking.start),
    end: toStockholmTime(booking.end),
    calendarId: booking.status,
    description: booking.event ?? "",
    location: getBookingLocation(booking),
    bookerName: getBookerName(booking),
    bookerStudentId: booking.booker?.studentId ?? "Unknown",
    bookerAvatarUrl: booking.booker?.picturePath ?? "",
    bookerInitials: getBookerInitials(booking),
  });
};

export const mapBookingsToCalendarEvents = (
  bookings: BookingSource[],
): BookingCalendarEvent[] =>
  bookings
    .map(mapBookingToCalendarEvent)
    .filter((booking): booking is BookingCalendarEvent => booking !== null);

export const filterBookingEvents = (
  bookings: BookingCalendarEvent[],
  opts: {
    categoryValue: string;
    defaultCategoryValue: string;
    mineOnly: boolean;
    currentStudentId: string | null;
  },
): BookingCalendarEvent[] => {
  const { categoryValue, defaultCategoryValue, mineOnly, currentStudentId } =
    opts;

  return bookings.filter((booking) => {
    const isDefaultCategory = categoryValue === defaultCategoryValue;

    if (!isDefaultCategory && booking.location !== categoryValue) {
      return false;
    }

    if (
      mineOnly &&
      (!currentStudentId || booking.bookerStudentId !== currentStudentId)
    ) {
      return false;
    }

    return true;
  });
};

export const getBookingStatusCount = (
  bookings: BookingCalendarEvent[],
  status: BookingStatus,
): number => bookings.filter((booking) => booking.calendarId === status).length;

export const getCategoryOptions = (
  bookings: BookingCalendarEvent[],
  defaultCategory: { value: string; label: string },
): Array<{ value: string; label: string }> =>
  [defaultCategory].concat(
    Array.from(
      new Set(
        bookings
          .map((booking) => booking.location)
          .filter(
            (location): location is string => typeof location === "string",
          ),
      ),
    ).map((location) => ({
      value: location,
      label: location,
    })),
  );
