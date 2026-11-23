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
    // Only a ticket held by a student id with no member has none; a member
    // without a name still has their picture and food preference.
    member: entry.isMember
      ? {
          studentId: entry.studentId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          nickname: entry.nickname,
          picturePath: entry.picturePath,
          foodPreference: entry.foodPreference,
        }
      : null,
  }));

  return { release, roster };
};
