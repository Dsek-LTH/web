// import { withAccess } from "$lib/utils/access";
// import prisma from "$lib/utils/prisma";
// import apiNames from "$lib/utils/apiNames";

import { start } from "repl";
import type { Actions, PageServerLoad } from "./$types";
// import type { Bookable } from "@prisma/client";
// import { ObjectCreatedAll } from "minio";
// import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });
  const bookables = await prisma.bookable.findMany();

  return { bookingRequests, bookables };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const data = await request.formData();
    const bookables: string[] = (data.get("bookables") || "").split(",");
    console.log(bookables);

    const createBookingRequest = await prisma.bookingRequest.create({
      data: {
        bookerId: user?.memberId,
        start: new Date(data.get("start") as string),
        end: new Date(data.get("end") as string),
        event: data.get("event") as string,
        bookables: {
          connect: bookables.map((bookable) => ({
            id: bookable, // TODO: send in filtered bookings from client
          })),
        },
        status: "PENDING",

        // start: data.get("start")
        // end: data.get("end") // TODO: add event thingy
        // created: new Date(),
        // event: data.get("event"),
        // status: "pending",
        // bookables:
      },
    });
  },
};
