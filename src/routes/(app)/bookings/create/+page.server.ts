import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { bookingSchema } from "$lib/bookings/schema";
import { saveBookingRequest } from "$lib/bookings/server/actions";
import {
  getBookingFormOptions,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import { serverApi } from "$lib/server/apiClient";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { user } = event.locals;
  const [options, meRes] = await Promise.all([
    getBookingFormOptions(event),
    user?.studentId
      ? serverApi(event).GET("/members/{studentId}", {
          params: { path: { studentId: user.studentId } },
        })
      : null,
  ]);
  // The booker is pre-selected as someone who should get door access.
  const currentMemberSearchAttributes = meRes?.data
    ? toMemberSearchAttributes(meRes.data)
    : null;

  return {
    ...options,
    form: await superValidate(zod4(bookingSchema)),
    currentMemberSearchAttributes,
  };
};

export const actions: Actions = {
  default: (event) => saveBookingRequest(event),
};
