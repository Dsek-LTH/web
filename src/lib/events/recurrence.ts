import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const EVENT_TIMEZONE = "Europe/Stockholm";

export type EventInterval = { start: Date; end: Date };

/**
 * Recurring events must keep the same wall-clock time in Europe/Stockholm
 * across DST changes, so all math here is done on calendar dates ("YYYY-MM-DD",
 * no time, no offset) and wall-clock times ("HH:mm"). An instant is only
 * produced at the very end, by resolving date + time in the event timezone.
 *
 * Do NOT do `dayjs.tz(date).hour(h)` instead: the object returned by
 * `dayjs.tz` carries a fixed UTC offset from *midnight*, which on the day of a
 * DST change is not the offset at `h`, so the result ends up an hour off.
 */

const toWallClock = (instant: Date) => {
  const local = dayjs(instant).tz(EVENT_TIMEZONE);
  return { date: local.format("YYYY-MM-DD"), time: local.format("HH:mm") };
};

const fromWallClock = (date: string, time: string) =>
  dayjs.tz(`${date} ${time}`, EVENT_TIMEZONE).toDate();

const addToDate = (date: string, amount: number, unit: dayjs.ManipulateType) =>
  dayjs.utc(date).add(amount, unit).format("YYYY-MM-DD");

/** The wall-clock shape of an event: when it starts, and when it ends relative to that. */
const toTemplate = ({ start, end }: EventInterval) => {
  const startLocal = toWallClock(start);
  const endLocal = toWallClock(end);
  return {
    startTime: startLocal.time,
    endTime: endLocal.time,
    // Whole calendar days between start and end, so overnight events stay overnight
    endDayOffset: dayjs
      .utc(endLocal.date)
      .diff(dayjs.utc(startLocal.date), "day"),
    startDate: startLocal.date,
  };
};

type Template = ReturnType<typeof toTemplate>;

const placeOnDate = (date: string, template: Template): EventInterval => ({
  start: fromWallClock(date, template.startTime),
  end: fromWallClock(
    addToDate(date, template.endDayOffset, "day"),
    template.endTime,
  ),
});

/**
 * All occurrences of a recurring event, from `first` up to and including the
 * day `lastDay` falls on. Every occurrence starts and ends at the same
 * Stockholm wall-clock time as `first`.
 */
export function generateOccurrences(
  first: EventInterval,
  lastDay: Date,
  step: number,
  unit: dayjs.ManipulateType,
): EventInterval[] {
  const template = toTemplate(first);
  const lastDate = toWallClock(lastDay).date;
  const occurrences: EventInterval[] = [];
  // ISO dates compare correctly as strings
  for (
    let date = template.startDate;
    date <= lastDate;
    date = addToDate(date, step, unit)
  ) {
    occurrences.push(placeOnDate(date, template));
  }
  return occurrences;
}

/**
 * Moves an existing occurrence to the wall-clock times of `updated`, keeping
 * the occurrence on its own date.
 */
export function retimeOccurrence(
  existing: Pick<EventInterval, "start">,
  updated: EventInterval,
): EventInterval {
  return placeOnDate(toWallClock(existing.start).date, toTemplate(updated));
}
