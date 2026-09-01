import apiNames from "$lib/utils/apiNames";
import { error, fail } from "@sveltejs/kit";
import { api } from "$lib/api/client";
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

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
  const { user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const res = await api.GET("/access-policies", {
    fetch,
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
  create: async ({ params, request, fetch }) => {
    const form = await superValidate(request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });

    const res = await api.POST("/access-policies", {
      fetch,
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
  delete: async ({ request, fetch }) => {
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });

    const res = await api.DELETE("/access-policies/{id}", {
      fetch,
      params: { path: { id: form.data.id } },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: "Policy borttagen",
      type: "success",
    });
  },
};
