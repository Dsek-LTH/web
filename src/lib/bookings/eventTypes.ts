import type { CalendarEventExternal } from "@schedule-x/calendar";

export type BookingStatus = "ACCEPTED" | "PENDING" | "DENIED";

export type BookingCalendarEvent = CalendarEventExternal & {
  calendarId: BookingStatus;
  bookerName: string;
  bookerStudentId: string;
  bookerAvatarUrl: string;
  bookerInitials: string;
};

export interface CreateBookingOptions {
  id?: string;
  title: string;
  start: Temporal.PlainDate | Temporal.ZonedDateTime;
  end: Temporal.PlainDate | Temporal.ZonedDateTime;
  calendarId: BookingStatus;
  description?: string;
  location?: string;
  bookerName?: string;
  bookerStudentId?: string;
  bookerAvatarUrl?: string;
  bookerInitials?: string;
}
