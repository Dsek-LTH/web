import { error, type NumericRange, type RequestEvent } from "@sveltejs/kit";
import type { components } from "$lib/api/schema";
import { serverApi } from "$lib/server/apiClient";

// Free-ticket releases, served by the Go backend's internal/tickets (it
// used to be the standalone ticket-service; folded in during the Phase 12
// upstream sync). Kept as a small module with the same function names the
// ticket pages already call; who may do what is decided in Go.

export class TicketServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Schemas = components["schemas"];
export type TicketRelease = Schemas["TicketRelease"];
export type ReleaseSummary = Schemas["TicketReleaseSummary"];
export type TicketQueueEntry = Schemas["TicketQueueEntry"];
export type MyTicket = Schemas["MemberTicket"];
export type RosterEntry = Schemas["TicketRosterEntry"];

/** Unwraps an openapi-fetch result, throwing TicketServiceError on failure. */
const unwrap = <T>(res: {
  data?: T;
  error?: { detail?: string; title?: string };
  response: Response;
}): T => {
  if (res.error || res.data === undefined) {
    throw new TicketServiceError(
      res.response.status,
      res.error?.detail ?? res.error?.title ?? res.response.statusText,
    );
  }
  return res.data;
};

/** unwrap for page loads: Go's status and detail become the page's error. */
const unwrapForLoad = <T>(res: Parameters<typeof unwrap<T>>[0]): T => {
  try {
    return unwrap(res);
  } catch (err) {
    if (err instanceof TicketServiceError)
      error(err.status as NumericRange<400, 599>, err.message);
    throw err;
  }
};

const path = (releaseId: string) => ({ params: { path: { id: releaseId } } });

export const createTicketRelease = async (
  event: RequestEvent,
  input: {
    eventId: string;
    title: string;
    description?: string;
    location?: string;
    quantity: number;
    opensAt: Date;
    closesAt: Date;
  },
) =>
  // Go sets the release's expiry to the event's end itself.
  unwrap(
    await serverApi(event).POST("/ticket-releases", {
      body: {
        ...input,
        opensAt: input.opensAt.toISOString(),
        closesAt: input.closesAt.toISOString(),
      },
    }),
  );

export const listTicketReleases = async (
  event: RequestEvent,
  opts?: { includeExpired?: boolean },
) =>
  unwrapForLoad(
    await serverApi(event).GET("/ticket-releases", {
      params: { query: { includeExpired: opts?.includeExpired ?? false } },
    }),
  ) ?? [];

export const getTicketRelease = async (
  event: RequestEvent,
  releaseId: string,
) =>
  unwrap(await serverApi(event).GET("/ticket-releases/{id}", path(releaseId)));

// For page loads: a missing release (404) or malformed id (422) becomes a
// SvelteKit 404, other failures Go's own status, instead of a 500.
export const getTicketReleaseOr404 = async (
  event: RequestEvent,
  releaseId: string,
) => {
  try {
    return await getTicketRelease(event, releaseId);
  } catch (err) {
    if (
      err instanceof TicketServiceError &&
      (err.status === 404 || err.status === 422)
    ) {
      error(404, "Biljettsläppet hittades inte");
    }
    if (err instanceof TicketServiceError)
      error(err.status as NumericRange<400, 599>, err.message);
    throw err;
  }
};

export const requestTicket = async (event: RequestEvent, releaseId: string) =>
  unwrap(
    await serverApi(event).POST(
      "/ticket-releases/{id}/request",
      path(releaseId),
    ),
  );

export const acceptTicketOffer = async (
  event: RequestEvent,
  releaseId: string,
) =>
  unwrap(
    await serverApi(event).POST(
      "/ticket-releases/{id}/accept",
      path(releaseId),
    ),
  );

export const cancelTicketEntry = async (
  event: RequestEvent,
  releaseId: string,
) => {
  const res = await serverApi(event).DELETE(
    "/ticket-releases/{id}/request",
    path(releaseId),
  );
  if (res.error) {
    throw new TicketServiceError(
      res.response.status,
      res.error.detail ?? res.response.statusText,
    );
  }
};

export const getTicketStatus = async (event: RequestEvent, releaseId: string) =>
  unwrap(
    await serverApi(event).GET(
      "/ticket-releases/{id}/request",
      path(releaseId),
    ),
  );

export const listMyTickets = async (event: RequestEvent) =>
  (unwrapForLoad(await serverApi(event).GET("/me/tickets", {})) ??
    []) as MyTicket[];

export const listTicketRoster = async (
  event: RequestEvent,
  releaseId: string,
) =>
  unwrapForLoad(
    await serverApi(event).GET("/ticket-releases/{id}/roster", path(releaseId)),
  ) ?? [];

export const updateTicketRelease = async (
  event: RequestEvent,
  releaseId: string,
  input: {
    title: string;
    description?: string;
    location?: string;
    quantity: number;
    closesAt: Date;
  },
) =>
  unwrap(
    await serverApi(event).PUT("/ticket-releases/{id}", {
      ...path(releaseId),
      body: { ...input, closesAt: input.closesAt.toISOString() },
    }),
  );
