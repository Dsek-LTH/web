import type { EmailAlias, Member } from "@prisma/client";
import type { RequestHandler } from "./$types";

import {
  getCurrentMembersForPosition,
  getEmailsForManyMembers,
  getAliasToPositions,
} from "./utils";

// To speed up the response time, we "cache" the response for 1 hour
let lastTimeSince = Date.now();
let prevResponse: string | null = null;
let hasReceivedUpdate = false;
const oneHourInMs = 1000 * 60 * 60;

export function _handleUpdate() {
  hasReceivedUpdate = true;
}

export const GET: RequestHandler = async ({ locals, setHeaders }) => {
  setHeaders({
    "Content-Type": "text/plain; charset=utf-8",
  });
  if (
    prevResponse !== null &&
    Date.now() - lastTimeSince < oneHourInMs &&
    !hasReceivedUpdate
  ) {
    return new Response(prevResponse);
  }
  hasReceivedUpdate = false;

  const prisma = locals.prisma;

  // This is the main data structure that we will use to create the response
  // It stores all the positions for a given alias, and the user emails for those positions
  // All code below is to fill this data structure
  const aliasToPosToUserEmails: Map<string, Map<string, string[]>> = new Map();

  // Fetch all positions which have an alias (could be multiple aliases for a position)
  const posToAlias: Map<string, EmailAlias[]> =
    await getAliasToPositions(prisma);

  const positionIds: Set<string> = new Set(
    Array.from(posToAlias.values()).flatMap((alist) =>
      alist.map((a) => a.positionId),
    ),
  );

  // Store all the members which have a mandate for a position
  const positionIdsToMembers: Map<
    string,
    Set<{ memberId: Member["id"]; studentId: Member["studentId"] }>
  > = new Map();
  for (const posId of positionIds) {
    // Fetch which members currently have a mandate for the position
    const members = await getCurrentMembersForPosition(posId, prisma);
    positionIdsToMembers.set(posId, new Set(members));
  }

  // We now store all members which we need to find the email for
  const allMembersWithPos: Array<{
    memberId: Member["id"];
    studentId: Member["studentId"];
  }> = [];
  for (const [, members] of positionIdsToMembers) {
    allMembersWithPos.push(...Array.from(members));
  }

  // Fetches all the emails for the members from Keycloak
  const userToEmail = await getEmailsForManyMembers(
    allMembersWithPos.map((m) => m.memberId),
    prisma,
  );

  for (const [alias, positions] of posToAlias) {
    const posMap = new Map();
    for (const pos of positions) {
      // Find which members have a mandate for the position
      const members = positionIdsToMembers.get(pos.positionId) ?? new Set();

      // Find the emails for those members
      const emails = Array.from(members).reduce<string[]>((acc, cur) => {
        // Ignore members without a studentId, they don't have an email
        if (cur.studentId === null) {
          return acc;
        }
        const email = userToEmail.get(cur.studentId);
        if (email !== undefined) {
          acc.push(email);
        }
        return acc;
      }, []);
      // Store the users emails for the position
      posMap.set(pos.positionId, emails);
    }
    aliasToPosToUserEmails.set(alias, posMap);
  }

  // Special receivers are stored in Prisma
  const specialReceivers = (
    await prisma.specialReceiver.findMany({
      orderBy: {
        email: "asc",
      },
    })
  ).reduce<Map<string, Set<string>>>((acc, cur) => {
    if (acc.has(cur.email)) {
      acc.get(cur.email)?.add(cur.targetEmail);
    } else {
      acc.set(cur.email, new Set([cur.targetEmail]));
    }
    return acc;
  }, new Map());

  // Now we have all the data we need to create the response
  let text = "";
  for (const [alias, positions] of aliasToPosToUserEmails) {
    text += `${alias.trim()} `;
    let shouldTrim = false;
    for (const [, userEmailsForPosition] of positions) {
      // Maybe we have a special receiver for the alias, like for kallelse@dsek.se
      if (specialReceivers.has(alias)) {
        for (const target of specialReceivers.get(alias) ?? []) {
          text += `${target.trim()}, `;
          shouldTrim = true;
        }
        // If found, remove it from the specialReceivers map
        // So we don't include it twice
        specialReceivers.delete(alias);
      }
      // Add all the emails for the position
      for (const userEmail of userEmailsForPosition) {
        text += `${userEmail.trim()}, `;
        shouldTrim = true;
      }
    }
    if (shouldTrim) text = text.slice(0, -2); // remove trailing comma and whitespace
    text += "\n";
  }
  // Finally go through the specialReceivers and add them to the response
  for (const [email, targets] of specialReceivers) {
    text += `${email.trim()} `;
    for (const target of targets) {
      text += `${target.trim()}, `;
    }
    if (targets.size > 0) text = text.slice(0, -2); // remove trailing comma and whitespace
    text += "\n";
  }

  // "Cache" the response
  prevResponse = text;
  lastTimeSince = Date.now();
  return new Response(text);
};
