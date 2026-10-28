import type { CalendarType } from "@schedule-x/calendar";

export type CalendarStatusCategory = "ACCEPTED" | "PENDING" | "DENIED";

type ConfigMode = "tailwind" | "css";
type CalendarStatusColors = Record<CalendarStatusCategory, string>;

const baseColors: CalendarStatusColors = {
  ACCEPTED: "primary",
  PENDING: "color-lila-400",
  DENIED: "destructive",
};

const bgColors: CalendarStatusColors = {
  ACCEPTED: "bg-primary/15",
  PENDING: "bg-lila-400/15",
  DENIED: "bg-destructive/15",
};

const textColors: CalendarStatusColors = {
  ACCEPTED: "text-primary",
  PENDING: "text-lila-400",
  DENIED: "text-destructive",
};

const beforeColors: CalendarStatusColors = {
  ACCEPTED: "before:bg-primary",
  PENDING: "before:bg-lila-400",
  DENIED: "before:bg-destructive",
};

export const bgColorsModal: CalendarStatusColors = {
  ACCEPTED: "bg-primary",
  PENDING: "bg-lila-400",
  DENIED: "bg-destructive",
};

export const shadowColorsModal: CalendarStatusColors = {
  ACCEPTED: "shadow-[0_0_4px_var(--primary)]",
  PENDING: "shadow-[0_0_4px_var(--color-lila-400)]",
  DENIED: "shadow-[0_0_4px_var(--destructive)]",
};

const getCalendarCategory = (
  categoryName: CalendarStatusCategory,
  mode: ConfigMode,
) => {
  const ColorName = baseColors[categoryName];
  const main =
    mode === "css" ? `var(--${ColorName})` : beforeColors[categoryName];
  const onContainer = mode === "css" ? main : textColors[categoryName];
  const container =
    mode === "css"
      ? `color-mix(in oklab, ${main} 15%, transparent)`
      : bgColors[categoryName];

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
