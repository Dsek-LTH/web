import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "./$types";
import { getCurrentMembersForPosition } from "../utils";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";

/**
 * Returns a text response where each line contains an email alias
 * followed by a list of ", " separated student IDs
 * that are allowed to send emails from that alias.
 *
 * @example
 *    GET /api/mail/alias/senders
 *
 *    Response:
 *    ```
 *    sexm@dsek.se ma6768ba-s
 *    styrelsen@dsek.se em5261ha-s, al4070an-s, le6853ha-s
 *    ```
 */
export const GET: RequestHandler = async ({ setHeaders }) => {
  const emailAddresses = await getAllEmailAddresses(authorizedPrismaClient);
  const emailToSenders = await getAllAliasSenders(
    authorizedPrismaClient,
    emailAddresses,
  );

  const output: string[] = [];
  for (const [emailAddress, senders] of Object.entries(emailToSenders)) {
    output.push(emailAddress + " " + senders.join(", "));
  }

  setHeaders({
    "Content-Type": "text/plain; charset=utf-8",
  });
  return new Response(output.join("\n"));
};

/**
 * @returns object containing all email addresses that are allowed to send emails
 */
async function getAllEmailAddresses(prisma: PrismaClient) {
  const aliases = await prisma.emailAlias.findMany({
    where: { canSend: true },
    orderBy: { email: "asc" },
  });
  const specialAliases = await prisma.specialSender.findMany({
    orderBy: { email: "asc" },
  });
  return { aliases, specialAliases };
}

type AliasObjects = Awaited<ReturnType<typeof getAllEmailAddresses>>;
/**
 * @returns map of email addresses -> student IDs that are allowed to send emails from that alias
 */
async function getAllAliasSenders(
  prisma: PrismaClient,
  { aliases, specialAliases }: AliasObjects,
) {
  const res: Record<string, string[]> = {};

  for (const alias of aliases) {
    res[alias.email] ??= [];
    const studentIds = (
      await getCurrentMembersForPosition(alias.positionId, prisma)
    )
      .map((member) => member.studentId)
      .filter((id): id is string => !!id);
    res[alias.email]!.push(...studentIds);
  }

  for (const specialAlias of specialAliases) {
    res[specialAlias.email] ??= [];
    res[specialAlias.email]!.push(specialAlias.studentId);
  }

  return res;
}
