import {
  getTicketReleaseOr404,
  getTicketStatus,
  requestTicket,
  acceptTicketOffer,
  cancelTicketEntry,
  TicketServiceError,
} from "$lib/server/ticketService";
import apiNames from "$lib/utils/apiNames";
import { fail, type RequestEvent } from "@sveltejs/kit";

export const load = async (event) => {
  const { params, locals, depends } = event;
  depends("ticket:status");

  const release = await getTicketReleaseOr404(event, params.releaseId);

  let status = null;
  let loggedIn = !!locals.member;
  if (loggedIn) {
    try {
      status = await getTicketStatus(event, params.releaseId);
    } catch (err) {
      if (!(err instanceof TicketServiceError)) throw err;
      // 401: the session has expired - show the sign-in prompt rather
      // than failing the whole page.
      if (err.status === 401) loggedIn = false;
      else if (err.status !== 404) throw err;
    }
  }

  return {
    release,
    status,
    loggedIn,
    // Only decides whether to link the admin page - Go gates it itself.
    canManage: !!locals.user?.policies?.includes(apiNames.WEBSHOP.MANAGE),
    // Lets the client line its countdown up with the server's clock, which
    // is what actually rejects requests made before opens_at.
    serverNow: Date.now(),
  };
};

const handleAction = async (
  action: (event: RequestEvent, releaseId: string) => Promise<unknown>,
  event: RequestEvent<{ releaseId: string }>,
) => {
  try {
    await action(event, event.params.releaseId);
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
  request: async (event) => handleAction(requestTicket, event),
  accept: async (event) => handleAction(acceptTicketOffer, event),
  cancel: async (event) => handleAction(cancelTicketEntry, event),
};
