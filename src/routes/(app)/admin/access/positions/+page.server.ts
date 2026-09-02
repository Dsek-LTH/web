import { fail, superValidate } from "sveltekit-superforms";
import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

const deletePolicySchema = z.object({ policyId: z.string() });
const createPolicySchema = z.object({
  position: z.string().nullable(),
  apiName: z.string(),
  studentId: z.string().nullable(),
});

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const { user } = locals;

  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const res = await serverApi(event).GET("/access-policies", {});
  if (res.error) throw error(500, "Failed to load access policies");

  const posToAccessPolicies = new Map<
    string,
    Array<{ apiName: string; id: string }>
  >();
  (res.data ?? []).forEach((a) => {
    if (a.role) {
      posToAccessPolicies.set(a.role, [
        ...(posToAccessPolicies.get(a.role) ?? []),
        { apiName: a.apiName, id: a.id },
      ]);
    }
  });
  const createForm = await superValidate(zod4(createPolicySchema));
  const deleteForm = await superValidate(zod4(deletePolicySchema));
  return { posToAccessPolicies, createForm, deleteForm };
};

export const actions: Actions = {
  deletePolicy: async (event) => {
    const form = await superValidate(event.request, zod4(deletePolicySchema));
    if (!form.valid) return fail(400, { form });
    await serverApi(event).DELETE("/access-policies/{id}", {
      params: { path: { id: form.data.policyId } },
    });
  },
  createPolicy: async (event) => {
    const form = await superValidate(event.request, zod4(createPolicySchema));
    if (!form.valid) return fail(400, { form });
    await serverApi(event).POST("/access-policies", {
      body: {
        apiName: form.data.apiName,
        role: form.data.position ?? undefined,
        studentId: form.data.studentId ?? undefined,
      },
    });
  },
};
