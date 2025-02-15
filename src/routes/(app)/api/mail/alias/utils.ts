import authorizedPrisma from "$lib/server/authorizedPrisma";

type Alias = {
  alias: string;
  users: string[];
};

/**
 * Fetches email aliases (e.g akta@dsek.se) and their
 * corresponding users from the database.
 */
export async function fetchAliasReceivers(): Promise<Alias[]> {
  const now = new Date();
  return await authorizedPrisma.emailAlias
    .findMany({
      select: {
        email: true,
        position: {
          select: {
            mandates: {
              where: { startDate: { lte: now }, endDate: { gte: now } },
              select: {
                member: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { email: "asc" },
    })
    .then((result) =>
      result.map((alias) => ({
        alias: alias.email,
        users: alias.position.mandates
          .map(({ member }) => member.email)
          .filter((email) => email !== null),
      })),
    );
}
/**
 * Fetches email aliases (e.g akta@dsek.se) and their
 * corresponding users from the database.
 */
export async function fetchAliasSenders(): Promise<Alias[]> {
  const now = new Date();
  return await authorizedPrisma.emailAlias
    .findMany({
      where: { canSend: { equals: true } },
      select: {
        email: true,
        position: {
          select: {
            mandates: {
              where: { startDate: { lte: now }, endDate: { gte: now } },
              select: {
                member: {
                  select: { studentId: true },
                },
              },
            },
          },
        },
      },
      orderBy: { email: "asc" },
    })
    .then((result) =>
      result.map((alias) => ({
        alias: alias.email,
        users: alias.position.mandates
          .map(({ member }) => member.studentId)
          .filter((studentId) => studentId !== null),
      })),
    );
}

/**
 * Fetches special receivers which are email aliases
 * connected to a member rather than a position.
 */
export async function fetchSpecialReceivers(): Promise<Alias[]> {
  const result = await authorizedPrisma.specialReceiver.findMany({
    select: { email: true, targetEmail: true },
    orderBy: { email: "asc" },
  });

  const grouped = Object.groupBy(result, ({ email }) => email);
  return Object.entries(grouped).map(([alias, receivers]) => ({
    alias,
    // groupBy should not return a key with undefined value
    users: receivers!.map((r) => r.targetEmail),
  }));
}

/**
 * Fetches special senders which are email aliases
 * connected to a member rather than a position.
 */
export async function fetchSpecialSenders(): Promise<Alias[]> {
  const result = await authorizedPrisma.specialSender.findMany({
    select: { email: true, studentId: true },
    orderBy: { email: "asc" },
  });

  const grouped = Object.groupBy(result, ({ email }) => email);
  return Object.entries(grouped).map(([alias, senders]) => ({
    alias,
    users: senders!.map((r) => r.studentId),
  }));
}

/**
 * All aliases MUST have a receiver, otherwise things break in our mailserver.
 */
export function addFallbackEmail(aliases: Alias[]) {
  return aliases.map((alias) => ({
    alias: alias.alias,
    users: alias.users.length > 0 ? alias.users : ["root@dsek.se"],
  }));
}

/**
 * All aliases should have a sender, otherwise there's no point in including it.
 */
export function removeEmptySenders(aliases: Alias[]) {
  return aliases.filter((alias) => alias.users.length > 0);
}

/**
 * Merges an array of Alias objects by combining users of the same alias.
 */
export function mergeAliases(aliases: Alias[]): Alias[] {
  const grouped = Object.groupBy(aliases, (item) => item.alias);

  return Object.entries(grouped).map(([alias, aliasObjects]) => ({
    alias,
    users: aliasObjects!.flatMap((obj) => obj.users),
  }));
}

export function stringifyAliases(aliases: Alias[]) {
  return aliases
    .map(({ alias, users }) => `${alias} ${users.join(", ")}`)
    .join("\n");
}
