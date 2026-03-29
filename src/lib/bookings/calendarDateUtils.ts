import * as m from "$paraglide/messages";

export const formatBookingTime = (
  timestamp: Temporal.ZonedDateTime | Temporal.PlainDate,
) =>
  timestamp
    .toPlainDateTime()
    .toPlainTime()
    .toString({ smallestUnit: "minute" });

export const bookingMonthLabels = [
  m.january(),
  m.february(),
  m.march(),
  m.april(),
  m.may(),
  m.june(),
  m.july(),
  m.august(),
  m.september(),
  m.october(),
  m.november(),
  m.december(),
];

export const bookingWeekdayLabels = [
  m.monday(),
  m.tuesday(),
  m.wednesday(),
  m.thursday(),
  m.friday(),
  m.saturday(),
  m.sunday(),
];
