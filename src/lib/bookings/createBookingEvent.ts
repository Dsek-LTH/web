import type { BookingCalendarEvent, CreateBookingOptions } from "./eventTypes";

export const createBookingEvent = (
  opts: CreateBookingOptions,
): BookingCalendarEvent => {
  const {
    id,
    title,
    start,
    end,
    calendarId,
    description,
    location,
    bookerName,
    bookerStudentId,
    bookerAvatarUrl,
    bookerInitials,
  } = opts;

  let timeLabel = "";
  if (start instanceof Temporal.ZonedDateTime) {
    const h = start.hour.toString().padStart(2, "0");
    const m = start.minute.toString().padStart(2, "0");
    timeLabel = `${h}:${m}`;
  }

  const customContent = {
    dateGrid: `<div class="space-x-1.5"><span>${location}</span>${
      timeLabel ? `<span class="font-normal">${timeLabel}</span>` : ""
    }</div>`,
  };

  return {
    id: id ?? crypto.randomUUID(),
    title,
    start,
    end,
    calendarId,
    description,
    location,
    bookerName: bookerName ?? "Unknown",
    bookerStudentId: bookerStudentId ?? "Unknown",
    bookerAvatarUrl: bookerAvatarUrl ?? "",
    bookerInitials: bookerInitials ?? "NN",
    _customContent: customContent,
  };
};
