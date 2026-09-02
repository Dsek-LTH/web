import apiNames from "$lib/utils/apiNames";
import { error, fail } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import {
  message,
  setError,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

const createSchema = z
  .object({
    role: z.string().nullable(),
    studentId: z.string().nullable(),
  })
  .refine(
    (data) =>
      (data.role !== null && data.studentId === null) ||
      (data.role === null && data.studentId !== null),
    {
      path: ["role"],
      message: "Either 'role' or 'studentId' must be defined",
    },
  );

const deleteSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;

export const load: PageServerLoad = async (event) => {
  const { locals, params } = event;
  const { user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const res = await serverApi(event).GET("/access-policies", {
    params: { query: { apiName: params.apiName } },
  });
  if (res.error) throw error(500, "Failed to load access policies");

  const createForm = await superValidate(zod4(createSchema));
  const deleteForm = await superValidate(zod4(deleteSchema));
  return {
    policies: res.data ?? [],
    createForm,
    deleteForm,
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { params, request } = event;
    const form = await superValidate(request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).POST("/access-policies", {
      body: {
        apiName: params.apiName,
        role: form.data.role ?? undefined,
        studentId: form.data.studentId ?? undefined,
      },
    });
    if (res.error) {
      return setError(form, "studentId", "Medlem hittades inte");
    }
    return message(form, {
      message: "Access policy skapad",
      type: "success",
    });
  },
  delete: async (event) => {
    const form = await superValidate(event.request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).DELETE("/access-policies/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: "Policy borttagen",
      type: "success",
    });
  },
};
