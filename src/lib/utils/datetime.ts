import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TIMEZONE = "Europe/Stockholm";

/** Converts an instant to the app's wall clock. */
export const toAppTime = (instant: dayjs.ConfigType) =>
  dayjs(instant).tz(APP_TIMEZONE);

/** The calendar date of an instant in the app timezone. */
export const appDateKey = (instant: Date) =>
  toAppTime(instant).format("YYYY-MM-DD");

/** The last calendar day occupied by an event with an exclusive end instant. */
export const appEndDateKey = (instant: Date) =>
  appDateKey(new Date(instant.getTime() - 1));

/** The instant at the start of a calendar day in the app timezone. */
export const appDayStart = (dateKey: string) =>
  dayjs.tz(`${dateKey} 00:00`, APP_TIMEZONE).toDate();
