import { browser } from "$app/environment";

export const featureFlags: string[] = ["expenses"];

export const isFeatureFlagEnabled = (flag: string) => {
  if (!featureFlags.includes(flag) || !browser) {
    return false;
  }
  const value = localStorage.getItem(flag);
  if (value === null || value === "false") {
    return false;
  }
  return true;
};

export const setFeatureFlag = (flag: string, value: boolean) => {
  if (!featureFlags.includes(flag)) {
    return false;
  }
  localStorage.setItem(flag, value.toString());
  return true;
};
