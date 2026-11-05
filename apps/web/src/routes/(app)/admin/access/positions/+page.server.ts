import { fail, superValidate } from "sveltekit-superforms";
import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";

const deletePolicySchema = z.object({ policyId: z.string() });

export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/access-policies", {});
  if (res.error)
    error(
      res.response.status,
      res.error.detail ?? "Failed to load access policies",
    );

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
  const deleteForm = await superValidate(zod4(deletePolicySchema));
  return { posToAccessPolicies, deleteForm };
};

export const actions: Actions = {
  deletePolicy: async (event) => {
    const form = await superValidate(event.request, zod4(deletePolicySchema));
    if (!form.valid) return fail(400, { form });
    await serverApi(event).DELETE("/access-policies/{id}", {
      params: { path: { id: form.data.policyId } },
    });
  },
};
