import {
  getTicketReleaseOr404,
  getTicketStatus,
  requestTicket,
  acceptTicketOffer,
  cancelTicketEntry,
  TicketServiceError,
} from "$lib/server/ticketService";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { fail } from "@sveltejs/kit";

export const load = async ({ params, locals, request, depends }) => {
  depends("ticket:status");

  const release = await getTicketReleaseOr404(request, params.releaseId);

  let status = null;
  let loggedIn = !!locals.member;
  if (loggedIn) {
    try {
      status = await getTicketStatus(request, params.releaseId);
    } catch (err) {
      if (!(err instanceof TicketServiceError)) throw err;
      // 401: the session's id_token has expired - show the sign-in prompt
      // rather than failing the whole page.
      if (err.status === 401) loggedIn = false;
      else if (err.status !== 404) throw err;
    }
  }

  return {
    release,
    status,
    loggedIn,
    // Same permission the admin release page requires.
    canManage: isAuthorized(apiNames.WEBSHOP.MANAGE, locals.user),
    // Lets the client line its countdown up with the server's clock, which
    // is what actually rejects requests made before opens_at.
    serverNow: Date.now(),
  };
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
