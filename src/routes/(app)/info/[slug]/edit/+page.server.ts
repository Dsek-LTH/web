import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { fail } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const markdownPage = await prisma.markdown.findUnique({
    where: {
      name: params.slug,
    },
  });
  if (markdownPage == undefined) {
    authorize(apiNames.MARKDOWNS.CREATE, user);
  } else {
    authorize(apiNames.MARKDOWNS.PAGE(params.slug).UPDATE, user);
  }

  return {
    form: await superValidate(
      {
        markdown: markdownPage?.markdown ?? "",
        markdownEn: markdownPage?.markdownEn ?? null,
      },
      zod(markdownSchema),
    ),
    isCreating: markdownPage == undefined,
  };
};

const markdownSchema = z.object({
  markdown: z.string(),
  markdownEn: z.string().nullable(),
});

export const actions: Actions = {
  create: async (event) => {
    const { request, locals, params } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, zod(markdownSchema));
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    await prisma.markdown.create({
      data: {
        name: name,
        ...form.data,
      },
    });
    await prisma.accessPolicy.create({
      data: {
        apiName: apiNames.MARKDOWNS.PAGE(name).UPDATE,
        studentId: user?.studentId,
      },
    });
    throw redirect(
      `/info/${name}`,
      {
        message: `"${name}"-sida uppdaterad`,
        type: "success",
      },
      event,
    );
  },
  update: async (event) => {
    const { request, locals, params } = event;
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(markdownSchema));
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    await updateMarkdown(user, prisma, { ...form.data, name });
    throw redirect(
      `/info/${name}`,
      {
        message: `"${name}"-sida uppdaterad`,
        type: "success",
      },
      event,
    );
  },
};
