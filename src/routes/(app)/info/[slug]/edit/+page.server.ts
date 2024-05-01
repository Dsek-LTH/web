import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "$lib/utils/redirect";
import { authorize } from "$lib/utils/authorization";

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
      { markdown: markdownPage?.markdown ?? "" },
      markdownSchema,
    ),
    isCreating: markdownPage == undefined,
  };
};

const markdownSchema = z.object({
  markdown: z.string(),
});

export const actions: Actions = {
  create: async (event) => {
    const { request, locals, params } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, markdownSchema);
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    await prisma.markdown.create({
      data: {
        name: name,
        markdown: form.data.markdown,
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
    const { prisma } = locals;
    const form = await superValidate(request, markdownSchema);
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    await prisma.markdown.update({
      where: {
        name: name,
      },
      data: {
        markdown: form.data.markdown,
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
};
