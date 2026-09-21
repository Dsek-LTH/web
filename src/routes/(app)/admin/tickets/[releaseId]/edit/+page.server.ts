import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { ticketReleaseEditSchema } from "$lib/utils/ticketRelease";
import {
  getTicketRelease,
  updateTicketRelease,
} from "$lib/server/ticketService";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export const load = async ({ params, locals, request }) => {
  const { user } = locals;
  authorize(apiNames.WEBSHOP.MANAGE, user);

  const release = await getTicketRelease(request, params.releaseId);

  return {
    release,
    form: await superValidate(
      {
        title: release.title,
        description: release.description,
        location: release.location,
        quantity: release.quantity,
        closesAt: dayjs(release.closesAt)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DDTHH:mm"),
      },
      zod4(ticketReleaseEditSchema),
      { errors: false },
    ),
  };
};

export const actions = {
  default: async (event) => {
    const { locals, request, params } = event;
    const { user } = locals;
    const form = await superValidate(request, zod4(ticketReleaseEditSchema));
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.MANAGE, user);

    try {
      await updateTicketRelease(request, params.releaseId, {
        ...form.data,
        closesAt: dayjs.tz(form.data.closesAt, "Europe/Stockholm").toDate(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return message(form, {
        message: m.ticketRelease_edit_error({ error: errorMsg }),
        type: "error",
      });
    }

    throw redirect(
      `/admin/tickets/${params.releaseId}`,
      { message: m.ticketRelease_edit_success(), type: "success" },
      event,
    );
  },
};
