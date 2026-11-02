import type { RequestEvent } from "@sveltejs/kit";
import {
  getTicketReleaseOr404,
  listTicketRoster,
} from "$lib/server/ticketService";

// The roster needs webshop:manage in Go (not READ_PURCHASES) because that's
// also the policy that gates reading a member's foodPreference field, which
// it shows.
export const loadRoster = async (event: RequestEvent, releaseId: string) => {
  // Fetch the release first so a bad id 404s before the roster call fails.
  const release = await getTicketReleaseOr404(event, releaseId);
  const entries = await listTicketRoster(event, releaseId);

  const roster = entries.map((entry) => ({
    memberId: entry.studentId,
    requestedAt: entry.requestedAt,
    updatedAt: entry.updatedAt,
    member:
      entry.firstName || entry.lastName
        ? {
            studentId: entry.studentId,
            firstName: entry.firstName ?? null,
            lastName: entry.lastName ?? null,
            nickname: entry.nickname ?? null,
            picturePath: entry.picturePath ?? null,
            foodPreference: entry.foodPreference ?? null,
          }
        : null,
  }));

  return { release, roster };
};
