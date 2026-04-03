/**
 *
 * @param {string} timeString String representing a time, ex. "17:15", "5.15pm" or "time 1715"
 * @returns {string | undefined} The parsed string in 24h format "17:15", or undefined if invalid
 */
function formatTimeString(timeString: string): string | undefined {
  const parsed = parseHourMinute(timeString);
  if (parsed === undefined) return undefined;
  let hour = parsed.hour;
  const minute = parsed.minute;

  const hInt = parseInt(hour);
  const mInt = parseInt(minute);

  if (hInt > 23 || mInt > 59) return undefined;

  if (1 <= hInt && hInt <= 12) hour = handleAmPm(hour, timeString);

  return `${hour}:${minute}`;
}

function parseHourMinute(
  timeString: string,
): { hour: string; minute: string } | undefined {
  const match = /\D*(\d{1,2})(\D*)(\d{0,2})(\D*)(\d*)\D*/.exec(timeString);
  if (match === null) return undefined;

  let { 1: hour, 3: minute } = match;
  const { 2: hsep, 4: msep, 5: trail } = match;
  hour ??= "";
  minute ??= "";

  if (hsep === "") {
    let number: string;
    if (msep === "") {
      number = hour + minute + trail;
      const l = number.length;
      if (l < 1 || 6 < l) return undefined;
    } else {
      number = hour + minute;
      const l = number.length;
      if (l < 1 || 4 < l) return undefined;
    }

    if (number.length === 3) {
      // ex. 115 should be read 01:15 instead of 11:05 or 11:50
      hour = number.at(0) ?? "";
      minute = number.substring(1);
    }
  } else if (msep === "" && (minute + trail).length > 4) return undefined;

  // pad
  hour = hour.padStart(2, "0");
  minute = minute.padStart(2, "0");

  return { hour, minute };
}

function handleAmPm(hour: string, original: string): string {
  const match = original
    .matchAll(/(am?)|(pm?)/gi)
    .toArray()
    .toSorted(
      (a, b) => b[0].length - a[0].length || -a[0].localeCompare(b[0]),
    )?.[0]?.[0];

  let hourInt = parseInt(hour);
  if (hourInt < 12 && match?.at(0) === "p") hourInt += 12;
  if (hourInt === 12 && match?.at(0) === "a") hourInt = 0;

  hour = hourInt.toString().padStart(2, "0");
  return hour;
}

export { formatTimeString };
