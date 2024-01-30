import prisma from "$lib/utils/prisma";
import { setError, superValidate } from "sveltekit-superforms/server";
import type { PageServerLoad } from "./$types";
import { createEmailPositionSchema } from "./schema";
import { fuseEmail, getEmailDomains } from "./emailutils";
import { fail, type Actions } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";

export const load: PageServerLoad = async () => {
  const createEmailPositionForm = await superValidate(
    createEmailPositionSchema,
  );
  const [emailAliases, positions, domains] = await Promise.all([
    await prisma.emailAlias.findMany({
      orderBy: {
        email: "asc",
      },
    }),
    await prisma.position.findMany({
      where: {
        active: true,
      },
    }),
    await getEmailDomains(),
  ]);

  return {
    emailAliases,
    positions,
    domains,
    createEmailPositionForm,
  };
};

export const actions: Actions = {
  createEmailPosition: async (event) => {
    const form = await superValidate(event.request, createEmailPositionSchema);
    if (!form.valid) return fail(400, { form });
    const { localPart, positionId, domain } = form.data;
    const email = fuseEmail({
      localPart,
      domain,
    });
    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
      },
    });
    if (position == null) {
      return setError(form, "positionId", "Positionen finns inte");
    }
    const existingEmailAlias = await prisma.emailAlias.findMany({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias.length > 0) {
      return setError(form, "localPart", "Aliaset finns redan");
    }
    await prisma.emailAlias.create({
      data: {
        email,
        position: {
          connect: {
            id: positionId,
          },
        },
      },
    });
    throw redirect(
      "/admin/mail-alias",
      {
        message: "E-postadressen skapad",
        type: "success",
      },
      event,
    );
  },
} satisfies Actions;
