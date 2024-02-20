export type Email = {
  localPart: string; // i.e. the part before the @
  domain: string;
};

export const getEmailDomains = (): readonly string[] => {
  return OWNED_DOMAINS;
};

export const splitEmail = (email: string): Email | null => {
  const splitted = email.split("@");
  if (splitted.length !== 2) return null;
  const { 0: localPart, 1: domain } = splitted;
  if (localPart == null || domain == null) return null;
  return {
    localPart,
    domain,
  };
};

export const fuseEmail = (email: Email): string => {
  let { localPart, domain } = email;
  localPart = localPart.trim().replaceAll("@", "");
  domain = domain.trim().replaceAll("@", "");
  return `${localPart}@${domain}`;
};

const emailRegex =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(dsek.se|nolla.nu|yrka.nu|teknikfokus.se|juble.se|geekend.se)$/;

export const isValidEmail = (email: string): boolean => {
  return email.trim() != "" && emailRegex.test(email);
};

const OWNED_DOMAINS = [
  "@dsek.se",
  "@nolla.nu",
  "@yrka.nu",
  "@teknikfokus.se",
  "@juble.se",
  "@geekend.se",
] as const;
