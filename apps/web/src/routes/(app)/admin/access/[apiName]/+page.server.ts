import { error, fail } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import { goError } from "$lib/utils/access";
import type { ErrorStatus } from "sveltekit-superforms";
import {
  message,
  setError,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

const createSchema = z.object({
  type: z.enum(["member", "role"]),
  subjects: z.array(z.string()).min(1),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;

export const load: PageServerLoad = async (event) => {
  const { params } = event;

  const res = await serverApi(event).GET("/access-policies", {
    params: { query: { apiName: params.apiName } },
  });
  if (res.error)
    error(
      res.response.status,
      res.error.detail ?? "Failed to load access policies",
    );

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
    const { type, subjects } = form.data;

    // One request for every selected subject, so a single unknown member
    // fails the whole batch in Go (one transaction) instead of leaving a
    // partial set of grants behind.
    const res = await serverApi(event).POST("/access-policies/bulk", {
      body: {
        apiName: params.apiName,
        roles: type === "role" ? subjects : [],
        studentIds: type === "member" ? subjects : [],
      },
    });
    if (res.error) {
      return setError(
        form,
        "",
        res.error.detail ?? "En eller flera medlemmar hittades inte",
        { status: res.response.status as ErrorStatus },
      );
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
    if (res.error) goError(res.response, res.error, "Failed to remove policy");

    return message(form, {
      message: "Policy borttagen",
      type: "success",
    });
  },
};
