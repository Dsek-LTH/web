/**
 * Semesters are encoded as numbers, given by
 * `2 * year + 0` for the spring semester.
 * `2 * year + 1` for the fall semester.
 *
 * This is useful for sorting by semesters.
 */
export type Semester = number;

export const semesterFromYearAndTerm = (year: number, term: "VT" | "HT") =>
  year * 2 + (term === "VT" ? 0 : 1);

export const semesterYear = (semester: Semester): number =>
  Math.floor(semester / 2);

const isSpringTerm = (semester: Semester): boolean => semester % 2 === 0;

export const semesterTerm = (semester: Semester): string =>
  isSpringTerm(semester) ? "VT" : "HT";

export const startDate = (semester: Semester): Date =>
  new Date(semesterYear(semester), isSpringTerm(semester) ? 0 : 6, 1);

export const endDate = (semester: Semester): Date =>
  isSpringTerm(semester)
    ? new Date(semesterYear(semester), 6, 1)
    : new Date(semesterYear(semester) + 1, 0, 1);

export const dateToSemester = (date: Date): Semester =>
  date.getFullYear() * 2 + (date.getMonth() >= 6 ? 1 : 0);

export const semesterRange = (start: Semester, end: Semester): Semester[] =>
  Array.from({ length: end - start + 1 }, (x, i) => start + i);

export const coveredSemesters = (
  startDate: Date,
  endDate: Date,
): Set<Semester> =>
  new Set<Semester>(
    semesterRange(dateToSemester(startDate), dateToSemester(endDate)),
  );

export const toString = (semester: Semester): string =>
  semesterTerm(semester) + " " + semesterYear(semester);

/**
 * Parse a semester from a string.
 * @param string The string to parse
 * @param errorFunction The function to call if the string is invalid
 * @returns The parsed semester
 * @throws If the string is invalid
 */
export const parseSemesterFromString = (
  string: string,
  errorFunction: (() => Error) | (() => never),
): Semester => {
  const match = string.match(/^(VT|HT) (\d{4})$/);
  if (match === null) {
    throw errorFunction();
  }
  const [, term, year] = match;
  if (term !== "VT" && term !== "HT") {
    throw errorFunction();
  }
  if (year === undefined) {
    throw errorFunction();
  }
  const yearInt = parseInt(year);
  if (isNaN(yearInt)) {
    throw errorFunction();
  }
  return semesterFromYearAndTerm(yearInt, term);
};
