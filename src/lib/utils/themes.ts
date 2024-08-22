export const themes = ["dark", "light", "nollningPostReveal"] as const;
export type Theme = (typeof themes)[number];
export const colors = {
  light: {
    primary: "#CC5E80",
    secondary: "#9966CC",
    accent: "#1fb2a6",
    neutral: "#2b3440",
    "base-100": "#DDDDDD",
    "base-200": "#e5e5e5",
    "base-300": "#ededed",
    info: "#0031a9",
    success: "#006800",
    warning: "#6f5500",
    error: "#a60000",
  },
  dark: {
    primary: "#F280A1",
    secondary: "#9966CC",
    accent: "#1dcdbc",
    neutral: "#2a323c",
    "base-100": "#252225",
    info: "#3abff8",
    success: "#36d399",
    warning: "#fbbd23",
    error: "#f87272",
  },
  nollningPostReveal: {
    primary: "#FF79C6",
    secondary: "#BD93F9",
    neutral: "#6272A4",
    accent: "#1dcdbc", // unused in figma
    "base-100": "#282A36",
    "base-200": "#44475A",
    "base-content": "#F8F8F2",
    // unused in figma below
    info: "#3abff8",
    success: "#36d399",
    warning: "#fbbd23",
    error: "#FF88DC",
  },
} as const;
