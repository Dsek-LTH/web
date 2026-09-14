import { fail, superValidate } from "sveltekit-superforms";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

const deletePolicySchema = z.object({ policyId: z.string() });

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;

  authorize(apiNames.ACCESS_POLICY.CREATE, user);

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
  const deleteForm = await superValidate(zod4(deletePolicySchema));
  return { posToAccessPolicies, deleteForm };
};

export const actions: Actions = {
  deletePolicy: async ({ locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(deletePolicySchema));
    if (!form.valid) return fail(400, { form });
    await prisma.accessPolicy.delete({
      where: {
        id: form.data.policyId,
      },
    });
  },
};
