import * as m from "$paraglide/messages";

export const getTime = (
  timestamp: Temporal.ZonedDateTime | Temporal.PlainDate,
) =>
  timestamp
    .toPlainDateTime()
    .toPlainTime()
    .toString({ smallestUnit: "minute" });

export const months = [
  m.january(),
  m.february(),
  m.march(),
  m.april(),
  m.may(),
  m.june(),
  m.july(),
  m.august(),
  m.september(),
  m.november(),
  m.december(),
];

export const days = [
  m.monday(),
  m.tuesday(),
  m.wednesday(),
  m.thursday(),
  m.friday(),
  m.saturday(),
  m.sunday(),
];
