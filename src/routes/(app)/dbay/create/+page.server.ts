import { createSchema } from "$lib/dbay/schema";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect.js";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const load = async (event) => {
  const { request, locals } = event;
  const { user } = locals;
  authorize(apiNames.MEMBER.CREATE, user);
  const form = await superValidate(request, zod(createSchema));
  return { form };
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    authorize(apiNames.MEMBER.CREATE, user);
    const form = await superValidate(request, zod(createSchema));
    if (!form.valid) return fail(400, { form });

    let slug = slugify(form.data.header);
    // authorized so we actually count all
    const slugCount = await authorizedPrismaClient.article.count({
      where: {
        slug: { startsWith: slug },
      },
    });
    slug = slugWithCount(slug, slugCount);

    await prisma.dbay.create({ data: { slug, ...form.data } });

    throw redirect(
      "/dbay",
      {
        message: "Listing Created",
        type: "success",
      },
      event,
    );
  },
};
