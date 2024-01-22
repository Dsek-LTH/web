import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "sveltekit-flash-message/server";

export const load: PageServerLoad = async ({ parent, params }) => {
  const markdownPage = await prisma.markdown.findUnique({
    where: {
      name: params.slug,
    },
  });
  const { accessPolicies } = await parent();
  if (markdownPage == undefined) {
    policyAccessGuard(apiNames.MARKDOWNS.CREATE, accessPolicies);
  } else {
    policyAccessGuard(
      apiNames.MARKDOWNS.PAGE(params.slug).UPDATE,
      accessPolicies,
    );
  }

  return {
    form: await superValidate(
      {
        markdown: markdownPage?.markdown ?? "",
      },
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
    const form = await superValidate(request, markdownSchema);
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    const session = await locals.getSession();
    return withAccess(
      apiNames.MARKDOWNS.CREATE,
      session?.user,
      async () => {
        await prisma.markdown.create({
          data: {
            name: name,
            markdown: form.data.markdown,
          },
        });
        await prisma.accessPolicy.create({
          data: {
            apiName: apiNames.MARKDOWNS.PAGE(name).UPDATE,
            studentId: session?.user?.student_id,
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
      form,
    );
  },
  update: async (event) => {
    const { request, locals, params } = event;
    const form = await superValidate(request, markdownSchema);
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    // read the form data sent by the browser
    const session = await locals.getSession();
    return withAccess(
      apiNames.MARKDOWNS.PAGE(name).UPDATE,
      session?.user,
      async () => {
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
      form,
    );
  },
};
