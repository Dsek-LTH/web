import {
  getTicketRelease,
  getTicketStatus,
  requestTicket,
  acceptTicketOffer,
  cancelTicketEntry,
  TicketServiceError,
} from "$lib/server/ticketService";
import { error, fail } from "@sveltejs/kit";

export const load = async ({ params, locals, request, depends }) => {
  depends("ticket:status");

  let release;
  try {
    release = await getTicketRelease(request, params.releaseId);
  } catch (err) {
    if (err instanceof TicketServiceError && err.status === 404) {
      error(404, "Biljettsläppet hittades inte");
    }
    throw err;
  }

  let status = null;
  const loggedIn = !!locals.member;
  if (loggedIn) {
    try {
      status = await getTicketStatus(request, params.releaseId);
    } catch (err) {
      if (!(err instanceof TicketServiceError && err.status === 404)) throw err;
    }
  }

  return { release, status, loggedIn };
};

const handleAction = async (
  action: (req: Request, releaseId: string) => Promise<unknown>,
  request: Request,
  releaseId: string,
) => {
  try {
    await action(request, releaseId);
  } catch (err) {
    if (err instanceof TicketServiceError) {
      return fail(err.status, { message: err.message });
    }
    return fail(500, {
      message: err instanceof Error ? err.message : String(err),
    });
  }
  return { success: true };
};

export const actions = {
  request: async ({ params, request }) =>
    handleAction(requestTicket, request, params.releaseId),
  accept: async ({ params, request }) =>
    handleAction(acceptTicketOffer, request, params.releaseId),
  cancel: async ({ params, request }) =>
    handleAction(cancelTicketEntry, request, params.releaseId),
};
