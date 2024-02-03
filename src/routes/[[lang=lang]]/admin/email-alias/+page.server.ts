import { setError, superValidate } from "sveltekit-superforms/server";
import type { PageServerLoad } from "./$types";
import {
  createEmailPositionSchema,
  createEmailSpecialSenderSchema,
  createEmailSpecialReceiverSchema,
} from "./schema";
import { fuseEmail, getEmailDomains } from "./emailutils";
import { fail, type Actions } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import translated from "$lib/utils/translated";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const [
    createEmailPositionForm,
    createEmailSpecialSenderForm,
    createEmailSpecialReceiverForm,
  ] = await Promise.all([
    await superValidate(event.request, createEmailPositionSchema),
    await superValidate(event.request, createEmailSpecialSenderSchema),
    await superValidate(event.request, createEmailSpecialReceiverSchema),
  ]);
  const [emailAliases, positions] = await Promise.all([
    await prisma.emailAlias
      .findMany({
        orderBy: {
          email: "asc",
        },
      })
      .then(translated),
    await prisma.position
      .findMany({
        where: {
          active: true,
        },
      })
      .then(translated),
  ]);
  const domains = getEmailDomains();

  return {
    emailAliases,
    positions,
    domains,
    createEmailPositionForm,
    createEmailSpecialSenderForm,
    createEmailSpecialReceiverForm,
  };
};

export const actions: Actions = {
  createEmailPosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(event.request, createEmailPositionSchema);
    if (!form.valid) return fail(400, { form });
    const { localPart, positionId, domain } = form.data;
    if (!getEmailDomains().includes(domain)) {
      return setError(form, "domain", "Ogiltig domän");
    }
    const email = fuseEmail({
      localPart,
      domain,
    });
    if (email == null) {
      return setError(form, "localPart", "Ogiltig e-postadress");
    }
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
        AND: {
          positionId: positionId,
          email: email,
        },
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
  createEmailSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      createEmailSpecialSenderSchema,
    );
    if (!form.valid) return fail(400, { form });
    const { localPart, domain } = form.data;
    const email = fuseEmail({
      localPart,
      domain,
    });
    const existingEmailAlias = await prisma.emailAlias.findMany({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias.length > 0) {
      return setError(form, "localPart", "Aliaset finns redan");
    }
    // TODO: Create special sender
    throw redirect(
      "/admin/mail-alias",
      {
        message: "E-postadressen skapad",
        type: "success",
      },
      event,
    );
  },
  createEmailSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      createEmailSpecialReceiverSchema,
    );
    if (!form.valid) return fail(400, { form });
    const { localPart, domain } = form.data;
    const email = fuseEmail({
      localPart,
      domain,
    });
    const existingEmailAlias = await prisma.emailAlias.findMany({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias.length > 0) {
      return setError(form, "localPart", "Aliaset finns redan");
    }
    // TODO: Create special receiver
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
