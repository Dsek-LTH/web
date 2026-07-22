import type { CalendarType } from "@schedule-x/calendar";

export type CalendarStatusCategory = "ACCEPTED" | "PENDING" | "DENIED";

type ConfigMode = "tailwind" | "css";
type CalendarStatusColours = Record<CalendarStatusCategory, string>;

const baseColours: CalendarStatusColours = {
  ACCEPTED: "primary",
  PENDING: "color-lila-400",
  DENIED: "destructive",
};

const bgColours: CalendarStatusColours = {
  ACCEPTED: "bg-primary/15",
  PENDING: "bg-lila-400/15",
  DENIED: "bg-destructive/15",
};

const textColours: CalendarStatusColours = {
  ACCEPTED: "text-primary",
  PENDING: "text-lila-400",
  DENIED: "text-destructive",
};

const beforeColours: CalendarStatusColours = {
  ACCEPTED: "before:bg-primary",
  PENDING: "before:bg-lila-400",
  DENIED: "before:bg-destructive",
};

export const bgColoursModal: CalendarStatusColours = {
  ACCEPTED: "bg-primary",
  PENDING: "bg-lila-400",
  DENIED: "bg-destructive",
};

export const shadowColoursModal: CalendarStatusColours = {
  ACCEPTED: "shadow-[0_0_4px_var(--primary)]",
  PENDING: "shadow-[0_0_4px_var(--color-lila-400)]",
  DENIED: "shadow-[0_0_4px_var(--destructive)]",
};

const getCalendarCategory = (
  categoryName: CalendarStatusCategory,
  mode: ConfigMode,
) => {
  const colourName = baseColours[categoryName];
  const main =
    mode === "css" ? `var(--${colourName})` : beforeColours[categoryName];
  const onContainer = mode === "css" ? main : textColours[categoryName];
  const container =
    mode === "css"
      ? `color-mix(in oklab, ${main} 15%, transparent)`
      : bgColours[categoryName];

  return {
    colorName: categoryName,
    lightColors: { main, container, onContainer },
    darkColors: { main, container, onContainer },
  };
};

const getCalendarStatusCategories: (
  mode: ConfigMode,
) => Record<CalendarStatusCategory, CalendarType> = (mode: ConfigMode) => ({
  ACCEPTED: getCalendarCategory("ACCEPTED", mode),
  PENDING: getCalendarCategory("PENDING", mode),
  DENIED: getCalendarCategory("DENIED", mode),
});

export const calendarStatusCategoriesCSS = getCalendarStatusCategories("css");
export const calendarStatusCategoriesTailwind =
  getCalendarStatusCategories("tailwind");
