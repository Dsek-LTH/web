import apiNames from "$lib/utils/apiNames";
import { serverApi } from "$lib/server/apiClient";
import { ticketReleaseSchema } from "$lib/utils/ticketRelease";
import { createTicketRelease } from "$lib/server/ticketService";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { APP_TIMEZONE } from "$lib/utils/datetime";
import dayjs from "dayjs";

// Creating requires webshop:create in Go.
export const load = async (event) => {
  // Upcoming, not cancelled events to attach a release to.
  const res = await serverApi(event).GET("/events", {
    params: { query: { span: "upcoming", page: 1, pageSize: 100 } },
  });
  const events = (res.data?.events ?? [])
    .filter((e) => !e.isCancelled)
    .map((e) => ({
      id: e.id,
      titleSv: e.titleSv,
      startDatetime: new Date(e.startAt),
    }));

  return {
    events,
    form: await superValidate(
      {
        quantity: 1,
        opensAt: dayjs()
          .tz(APP_TIMEZONE)
          .add(1, "day")
          .hour(12)
          .minute(0)
          .second(0)
          .format("YYYY-MM-DDTHH:mm"),
        closesAt: dayjs()
          .tz(APP_TIMEZONE)
          .add(2, "day")
          .hour(12)
          .minute(0)
          .second(0)
          .format("YYYY-MM-DDTHH:mm"),
      },
      zod4(ticketReleaseSchema),
      { errors: false },
    ),
  };
};

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const form = await superValidate(request, zod4(ticketReleaseSchema));
    if (!form.valid) return fail(400, { form });

    let releaseId: string;
    try {
      // Go sets the release's expiry from the linked event's end.
      const release = await createTicketRelease(event, {
        ...form.data,
        opensAt: dayjs.tz(form.data.opensAt, APP_TIMEZONE).toDate(),
        closesAt: dayjs.tz(form.data.closesAt, APP_TIMEZONE).toDate(),
      });
      releaseId = release.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return message(form, {
        message: m.ticketRelease_create_error({ error: errorMsg }),
        type: "error",
      });
    }

    // The release page needs WEBSHOP.MANAGE, which creating doesn't imply.
    throw redirect(
      locals.user?.policies?.includes(apiNames.WEBSHOP.MANAGE)
        ? `/admin/tickets/${releaseId}`
        : "/admin/tickets",
      { message: m.ticketRelease_create_success(), type: "success" },
      event,
    );
  },
};
