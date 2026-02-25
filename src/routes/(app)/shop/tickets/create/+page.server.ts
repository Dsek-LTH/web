import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { fail } from "@sveltejs/kit";
import dayjs from "dayjs";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { createTicket } from "$lib/server/shop/tickets/mutations";
import { ticketSchema } from "$lib/utils/shop/types";

export const load = async ({ locals }) => {
	const { user } = locals;
	authorize(apiNames.WEBSHOP.CREATE, user);

	return {
		form: await superValidate(
			{
				availableFrom: dayjs(new Date())
					.add(1, "day")
					.hour(12)
					.minute(15)
					.second(0)
					.toDate(),
				maxAmountPerUser: 1,
				stock: 0,
				price: 0,
			},
			zod(ticketSchema),
			{ errors: false },
		),
	};
};

export const actions = {
	default: async (event) => {
		const { locals, request } = event;
		const { prisma, user, member } = locals;
		const form = await superValidate(request, zod(ticketSchema));
		if (!form.valid) return fail(400, { form });
		authorize(apiNames.WEBSHOP.CREATE, user);
		if (!member) {
			// this should be handled by the authorization call above
			return message(form, {
				message: "Du måste vara inloggad för att skapa biljetter",
				type: "error,",
			});
		}
		let ticketId: string;
		try {
			const ticket = await createTicket(prisma, member.id, form.data);
			ticketId = ticket.id;
		} catch (err) {
			let errorMsg;
			if (err instanceof Error) errorMsg = err.message;
			else errorMsg = String(err);
			console.log("Error creating ticket", errorMsg);
			return message(form, {
				message: "Kunde inte skapa biljett: " + errorMsg,
				type: "error,",
			});
		}
		throw redirect(
			`/shop/tickets/${ticketId}`,
			{
				message: "Biljett skapad",
				type: "success",
			},
			event,
		);
	},
};
