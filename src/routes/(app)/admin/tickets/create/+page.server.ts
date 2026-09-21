import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { ticketReleaseSchema } from "$lib/utils/ticketRelease";
import { createTicketRelease } from "$lib/server/ticketService";
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

export const load = async ({ locals }) => {
  const { user, prisma } = locals;
  authorize(apiNames.WEBSHOP.CREATE, user);

  const events = await prisma.event.findMany({
    where: {
      endDatetime: { gte: new Date() },
      isCancelled: false,
    },
    orderBy: { startDatetime: "asc" },
    select: { id: true, titleSv: true, startDatetime: true },
    take: 100,
  });

  return {
    events,
    form: await superValidate(
      {
        quantity: 1,
        opensAt: dayjs()
          .tz("Europe/Stockholm")
          .add(1, "day")
          .hour(12)
          .minute(0)
          .second(0)
          .format("YYYY-MM-DDTHH:mm"),
        closesAt: dayjs()
          .tz("Europe/Stockholm")
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
    const { user, prisma } = locals;
    const form = await superValidate(request, zod4(ticketReleaseSchema));
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.CREATE, user);

    const chosenEvent = await prisma.event.findUnique({
      where: { id: form.data.eventId },
      select: { endDatetime: true },
    });
    if (!chosenEvent) {
      return message(form, {
        message: m.ticketRelease_create_error({
          error: "Event not found",
        }),
        type: "error",
      });
    }

    let releaseId: string;
    try {
      const release = await createTicketRelease(request, {
        ...form.data,
        opensAt: dayjs.tz(form.data.opensAt, "Europe/Stockholm").toDate(),
        closesAt: dayjs.tz(form.data.closesAt, "Europe/Stockholm").toDate(),
        // The release disappears once the linked event is over - never
        // client-supplied, always derived from the real event record.
        expiresAt: chosenEvent.endDatetime,
      });
      releaseId = release.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return message(form, {
        message: m.ticketRelease_create_error({ error: errorMsg }),
        type: "error",
      });
    }

    throw redirect(
      `/admin/tickets/${releaseId}`,
      { message: m.ticketRelease_create_success(), type: "success" },
      event,
    );
  },
};
