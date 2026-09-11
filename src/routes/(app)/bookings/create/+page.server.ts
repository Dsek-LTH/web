import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { bookingSchema } from "$lib/bookings/schema";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { sendNotificationToKM } from "$lib/bookings/server/actions";
import { toMemberSearchAttributes } from "$lib/bookings/server/queries";
import { redirect } from "sveltekit-flash-message/server";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { Actions } from "./$types";

dayjs.extend(utc);
dayjs.extend(timezone);

export const load = async ({ locals }) => {
  const { prisma, user } = locals;
  const bookables = await prisma.bookable.findMany();
  const doors = await authorizedPrismaClient.door.findMany();
  const form = await superValidate(zod4(bookingSchema));

  const currentMember = user?.memberId
    ? await authorizedPrismaClient.member.findUnique({
        where: { id: user.memberId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nickname: true,
          studentId: true,
          picturePath: true,
          classYear: true,
          classProgramme: true,
        },
      })
    : null;
  const currentMemberSearchAttributes = currentMember
    ? toMemberSearchAttributes(currentMember)
    : null;

  return { bookables, doors, form, currentMemberSearchAttributes };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    const form = await superValidate(request, zod4(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables, accessDoors, accessMemberIds } =
      form.data;

    const createdRequest = await prisma.bookingRequest.create({
      data: {
        bookerId: user?.memberId,
        start: dayjs
          .tz(start, "Europe/Stockholm")
          .tz("Etc/UTC")
          .format("YYYY-MM-DDTHH:mm:ssZ"),
        end: dayjs
          .tz(end, "Europe/Stockholm")
          .tz("Etc/UTC")
          .format("YYYY-MM-DDTHH:mm:ssZ"),
        event: name,
        bookables: {
          connect: bookables.map((bookable) => ({ id: bookable })),
        },
        accessDoors: {
          connect: accessDoors.map((doorName) => ({ name: doorName })),
        },
        accessMembers: {
          connect: accessMemberIds.map((memberId) => ({ id: memberId })),
        },
        status: "PENDING",
      },
      include: { bookables: true },
    });

    await sendNotificationToKM(createdRequest, prisma).catch((e) => {
      console.log("Failed sending notifications to KM: ", e);
    });

    throw redirect(
      `/bookings`,
      {
        message: m.booking_requestSent(),
        type: "success",
      },
      event,
    );
  },
};
