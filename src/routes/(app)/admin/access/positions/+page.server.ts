import { fail, superValidate } from "sveltekit-superforms";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { zod } from "sveltekit-superforms/adapters";

const deletePolicySchema = z.object({ policyId: z.string() });
const createPolicySchema = z.object({
	position: z.string().nullable(),
	apiName: z.string(),
	studentId: z.string().nullable(),
});

export const load: PageServerLoad = async ({ locals }) => {
	const { prisma } = locals;
	const accesspolicies = await prisma.accessPolicy.findMany({
		select: { role: true, apiName: true, id: true },
	});
	const posToAccessPolicies = new Map<
		string,
		Array<{ apiName: string; id: string }>
	>();
	accesspolicies.forEach((a) => {
		if (a.role) {
			posToAccessPolicies.set(a.role, [
				...(posToAccessPolicies.get(a.role) ?? []),
				{ apiName: a.apiName, id: a.id },
			]);
		}
	});
	const createForm = await superValidate(zod(createPolicySchema));
	const deleteForm = await superValidate(zod(deletePolicySchema));
	return { posToAccessPolicies, createForm, deleteForm };
};

export const actions: Actions = {
	deletePolicy: async ({ locals, request }) => {
		const { prisma } = locals;
		const form = await superValidate(request, zod(deletePolicySchema));
		if (!form.valid) return fail(400, { form });
		await prisma.accessPolicy.delete({
			where: {
				id: form.data.policyId,
			},
		});
	},
	createPolicy: async ({ locals, request }) => {
		const { prisma } = locals;
		const form = await superValidate(request, zod(createPolicySchema));
		if (!form.valid) return fail(400, { form });
		await prisma.accessPolicy.create({
			data: {
				apiName: form.data.apiName,
				role: form.data.position,
				studentId: form.data.studentId,
			},
		});
	},
};
