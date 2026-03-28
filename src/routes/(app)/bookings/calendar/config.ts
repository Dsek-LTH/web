import type { CalendarType } from "@schedule-x/calendar";

export type CalendarStatusCategory = "accepted" | "pending" | "rejected";

type ConfigMode = "tailwind" | "css";
type CalendarStatusColours = Record<CalendarStatusCategory, string>;

const baseColours: CalendarStatusColours = {
  accepted: "primary",
  pending: "color-lila-400",
  rejected: "destructive",
};

const bgColours: CalendarStatusColours = {
  accepted: "bg-primary/15",
  pending: "bg-lila-400/15",
  rejected: "bg-destructive/15",
};

const textColours: CalendarStatusColours = {
  accepted: "text-primary",
  pending: "text-lila-400",
  rejected: "text-destructive",
};

const beforeColours: CalendarStatusColours = {
  accepted: "before:bg-primary",
  pending: "before:bg-lila-400",
  rejected: "before:bg-destructive",
};

export const bgColoursModal: CalendarStatusColours = {
  accepted: "bg-primary",
  pending: "bg-lila-400",
  rejected: "bg-destructive",
};

export const shadowColoursModal: CalendarStatusColours = {
  accepted: "shadow-[0_0_4px_var(--primary)]",
  pending: "shadow-[0_0_4px_var(--color-lila-400)]",
  rejected: "shadow-[0_0_4px_var(--destructive)]",
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
  accepted: getCalendarCategory("accepted", mode),
  pending: getCalendarCategory("pending", mode),
  rejected: getCalendarCategory("rejected", mode),
});

export const calendarStatusCategoriesCSS = getCalendarStatusCategories("css");
export const calendarStatusCategoriesTailwind =
  getCalendarStatusCategories("tailwind");
