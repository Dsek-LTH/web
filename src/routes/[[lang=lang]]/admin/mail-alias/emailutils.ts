import prisma from "$lib/utils/prisma";

export type Email = {
  localPart: string; // i.e. the part before the @
  domain: string;
};

export const getEmailDomains = async (): Promise<Array<Email["domain"]>> => {
  const emailAliases = await prisma.emailAlias.findMany();
  const domains = new Set<string>();
  emailAliases.forEach((alias) => {
    const email = alias.email;
    if (email != null) {
      const splitted = splitEmail(email);
      if (splitted != null) {
        domains.add(splitted.domain);
      }
    }
  });
  return Array.from(domains);
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
