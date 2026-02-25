import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { updateSchema } from "../types";

export const load: PageServerLoad = async ({ locals, url }) => {
	const { prisma } = locals;
	const openingHours = prisma.markdown.findMany({
		where: {
			name: {
				startsWith: "cafe:open",
			},
		},
		orderBy: {
			name: "asc",
		},
	});
	return committeeLoad(prisma, "cafe", url).then(async (data) => ({
		...data,
		openingHours: await openingHours,
	}));
};

export const actions = {
	...committeeActions("cafe"),
	updateHours: async ({ request, locals }) => {
		const { user, prisma } = locals;
		const form = await superValidate(request, zod(updateSchema));
		if (!form.valid) return fail(400, { form });

		const { markdownSv, markdownEn, markdownSlug } = form.data;

		if (markdownSlug && markdownSv) {
			await updateMarkdown(user, prisma, {
				name: markdownSlug,
				markdownSv,
				markdownEn,
			});

			return message(form, {
				message: m.committees_committeeUpdated(),
				type: "success",
			});
		}

		return message(form, {
			message: m.committees_errors_fetchMarkdown(),
			type: "error",
		});
	},
};
