import { fail, superValidate } from "sveltekit-superforms";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { zod } from "sveltekit-superforms/adapters";

export const _closeAlertSchema = z.object({
	alertId: z.string(),
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const { prisma } = locals;
	const form = await superValidate(request, zod(_closeAlertSchema));
	if (!form.valid) throw fail(400, { form });
	await prisma.alert.update({
		where: { id: form.data.alertId },
		data: {
			closedByMember: { connect: { id: locals.user?.memberId } },
		},
	});
	return new Response();
};
