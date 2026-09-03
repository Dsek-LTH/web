import * as m from "$paraglide/messages";
import { serverApi } from "$lib/server/apiClient";
import { fail, type Actions } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { updateCommitteeBody, updateCommitteeSchema } from "./types";

export const committeeActions = (
  shortName?: string,
): Actions<{ shortName: string }> => ({
  updateCommitteeMarkdown: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const sn = shortName ?? params.shortName;
    const form = await superValidate(request, zod4(updateCommitteeBody));
    if (!form.valid) return fail(400);

    const { markdownSv, markdownEn, markdownSlug } = form.data;
    if (!markdownSlug || !markdownSv) {
      return message(form, {
        message: m.committees_committeeUpdated(),
        type: "success",
      });
    }

    const body = { markdownSv, markdownEn: markdownEn ?? undefined };
    const res =
      markdownSlug === sn + "_links"
        ? await api.PUT("/committees/{shortName}/links", {
            params: { path: { shortName: sn } },
            body,
          })
        : await api.PUT("/committees/{shortName}/markdown", {
            params: { path: { shortName: sn } },
            body,
          });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
  updateCommitteeDetails: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const sn = shortName ?? params.shortName;
    const form = await superValidate(request, zod4(updateCommitteeSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const res = await api.PATCH("/committees/{shortName}", {
      params: { path: { shortName: sn } },
      body: {
        nameSv: form.data.nameSv ?? "",
        nameEn: form.data.nameEn ?? undefined,
        descriptionSv: form.data.descriptionSv ?? undefined,
        descriptionEn: form.data.descriptionEn ?? undefined,
        darkImageUrl: form.data.darkImageUrl ?? undefined,
        lightImageUrl: form.data.lightImageUrl ?? undefined,
        monoImageUrl: form.data.monoImageUrl ?? undefined,
        symbolUrl: form.data.symbolUrl ?? undefined,
        bannerUrl: form.data.bannerUrl ?? undefined,
        previewUrl: form.data.previewUrl ?? undefined,
        isBannerTextLight: form.data.isBannerTextLight,
      },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
});
