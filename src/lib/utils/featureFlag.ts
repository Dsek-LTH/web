export const featureFlags: string[] = [];

export const isFeatureFlagEnabled = (flag: string) => {
  if (!featureFlags.includes(flag)) {
    return false;
  }
  const value = localStorage.getItem(flag);
  if (value === null || value === "false") {
    return false;
  }
  return true;
};

export const setDefaultFlags = () => {
  featureFlags.forEach((f) => localStorage.setItem(f, "false"));
};

export const setFeatureFlag = (flag: string, value: boolean) => {
  if (!featureFlags.includes(flag)) {
    return false;
  }
  localStorage.setItem(flag, value.toString());
  return true;
};
