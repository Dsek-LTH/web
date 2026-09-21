import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";
import { env } from "$env/dynamic/private";

export class TicketServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(
  req: Request,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> => {
  const jwt = await getDecryptedJWT(req);
  const res = await fetch(`${env.TICKET_SERVICE_ENDPOINT}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt?.["id_token"]}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new TicketServiceError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};

export type TicketRelease = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  location: string;
  quantity: number;
  opensAt: string;
  closesAt: string;
  expiresAt: string;
  graceWindowSeconds: number;
  offerWindowSeconds: number;
  status: string;
};

export type ReleaseSummary = {
  id: string;
  title: string;
  description: string;
  location: string;
  opensAt: string;
  closesAt: string;
  status: string;
  quantity: number;
  claimed: number;
  waitlisted: number;
};

export type TicketQueueEntry = {
  status:
    | "pending"
    | "granted"
    | "waitlisted"
    | "accepted"
    | "expired"
    | "cancelled";
  queuePosition?: number;
  offerExpiresAt?: string;
};

export type MyTicket = TicketQueueEntry & {
  releaseId: string;
  releaseTitle: string;
};

export type ReleaseEntry = TicketQueueEntry & {
  memberId: string;
  requestedAt: string;
  updatedAt: string;
};

export const createTicketRelease = (
  req: Request,
  input: {
    eventId: string;
    title: string;
    description?: string;
    location?: string;
    quantity: number;
    opensAt: Date;
    closesAt: Date;
    expiresAt: Date;
  },
) =>
  request<TicketRelease>(req, "POST", "/releases", {
    eventId: input.eventId,
    title: input.title,
    description: input.description,
    location: input.location,
    quantity: input.quantity,
    opensAt: input.opensAt.toISOString(),
    closesAt: input.closesAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
  });

export const listTicketReleases = (
  req: Request,
  opts?: { includeExpired?: boolean },
) =>
  request<ReleaseSummary[]>(
    req,
    "GET",
    opts?.includeExpired ? "/releases?includeExpired=true" : "/releases",
  );

export const getTicketRelease = (req: Request, releaseId: string) =>
  request<ReleaseSummary>(req, "GET", `/releases/${releaseId}`);

export const requestTicket = (req: Request, releaseId: string) =>
  request<TicketQueueEntry>(req, "POST", `/releases/${releaseId}/request`);

export const acceptTicketOffer = (req: Request, releaseId: string) =>
  request<TicketQueueEntry>(req, "POST", `/releases/${releaseId}/accept`);

export const cancelTicketEntry = (req: Request, releaseId: string) =>
  request<undefined>(req, "DELETE", `/releases/${releaseId}/request`);

export const getTicketStatus = (req: Request, releaseId: string) =>
  request<TicketQueueEntry>(req, "GET", `/releases/${releaseId}/status`);

export const listMyTickets = (req: Request) =>
  request<MyTicket[]>(req, "GET", "/me/tickets");

export const listTicketEntries = (req: Request, releaseId: string) =>
  request<ReleaseEntry[]>(req, "GET", `/releases/${releaseId}/entries`);

export const updateTicketRelease = (
  req: Request,
  releaseId: string,
  input: {
    title: string;
    description?: string;
    location?: string;
    quantity: number;
    closesAt: Date;
  },
) =>
  request<TicketRelease>(req, "PATCH", `/releases/${releaseId}`, {
    title: input.title,
    description: input.description,
    location: input.location,
    quantity: input.quantity,
    closesAt: input.closesAt.toISOString(),
  });
