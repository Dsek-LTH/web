import type { CalendarEventExternal } from "@schedule-x/calendar";

export type BookingCalendarEvent = CalendarEventExternal & {
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
  calendarId: string;
  description?: string;
  location?: string;
  bookerName?: string;
  bookerStudentId?: string;
  bookerAvatarUrl?: string;
  bookerInitials?: string;
}
