import apiNames from "$lib/utils/apiNames";
import { error, fail } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const { user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const res = await serverApi(event).GET("/access-policies/api-names", {});
  if (res.error) throw error(500, "Failed to load access policies");

  const form = await superValidate(zod4(createSchema));
  return {
    accessPolicies: res.data ?? [],
    form,
  };
};

const createSchema = z.object({
  apiName: z.string().default(""),
});

export const actions: Actions = {
  create: async (event) => {
    const form = await superValidate(event.request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).POST("/access-policies", {
      body: { apiName: form.data.apiName, role: "*" },
    });
    if (res.error) return fail(400, { form });

    return message(form, {
      message: m.admin_access_policyCreated(),
      type: "success",
    });
  },
};
