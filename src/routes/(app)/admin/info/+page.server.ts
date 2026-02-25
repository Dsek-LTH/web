import { fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { infoPageSchema } from "./schemas";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { slugify } from "$lib/utils/slugify";

export const load: PageServerLoad = async () => ({
	form: await superValidate(zod(infoPageSchema)),
});

export const actions: Actions = {
	create: async (event) => {
		const { request, locals } = event;
		const { prisma } = locals;
		const form = await superValidate(request, zod(infoPageSchema));
		if (!form.valid) return fail(400, { form });
		const { name, markdownSv, markdownEn } = form.data;
		await prisma.markdown.create({
			data: {
				name: slugify(name),
				markdownSv,
				markdownEn,
			},
		});
		throw redirect(
			`/info/${name}`,
			{
				message: `${m.admin_info_infoPageCreated()}`,
				type: "success",
			},
			event,
		);
	},
};
