import { message, setError, superValidate } from "sveltekit-superforms/server";
import type { PageServerLoad } from "./$types";
import {
  createEmailPositionSchema,
  createEmailSpecialSenderSchema,
  createEmailSpecialReceiverSchema,
} from "./schema";
import { fuseEmail, getEmailDomains, isValidEmail } from "./emailutils";
import { fail, type Actions } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import keycloak from "$lib/utils/keycloak";
import { _handleUpdate } from "../../api/mail/alias/+server";

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
  const [emailAliases, positions, specialReceivers, specialSenders] =
    await Promise.all([
      await prisma.emailAlias.findMany({
        orderBy: {
          email: "asc",
        },
      }),
      await prisma.position.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      await prisma.specialReceiver.findMany({
        orderBy: {
          email: "asc",
        },
      }),
      await prisma.specialSender.findMany({
        orderBy: {
          email: "asc",
        },
      }),
    ]);
  const domains = getEmailDomains();

  return {
    emailAliases,
    specialReceivers,
    specialSenders,
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
    const {
      localPartAlias: localPart,
      positionIdAlias: positionId,
      domainAlias: domain,
    } = form.data;
    if (!getEmailDomains().includes(domain)) {
      return setError(form, "domainAlias", "Ogiltig domän");
    }
    const email = fuseEmail({
      localPart,
      domain,
    });
    if (email == null || !isValidEmail(email)) {
      return setError(form, "localPartAlias", "Ogiltig e-postadress");
    }
    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
      },
    });
    if (position == null) {
      return setError(form, "positionIdAlias", "Positionen finns inte");
    }
    const existingEmailAlias = await prisma.emailAlias.findFirst({
      where: {
        AND: {
          positionId: positionId,
          email: email,
        },
      },
    });
    if (existingEmailAlias != null) {
      return setError(form, "localPartAlias", "Aliaset finns redan");
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
    _handleUpdate();
    return message(form, {
      message: "E-postadressen skapad",
      type: "success",
    });
  },

  createEmailSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      createEmailSpecialSenderSchema,
    );
    if (!form.valid) return fail(400, { form });
    const {
      localPartSender: localPart,
      domainSender: domain,
      usernameSender: username,
    } = form.data;
    const email = fuseEmail({
      localPart,
      domain,
    });
    if (email == null || !isValidEmail(email)) {
      return setError(form, "localPartSender", "Ogiltig e-postadress");
    }
    const existingEmailAlias = await prisma.emailAlias.findFirst({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias != null) {
      return setError(form, "localPartSender", "Aliaset finns redan");
    }
    const existingSpecialSender = await prisma.specialSender.findFirst({
      where: {
        email: email,
      },
    });
    if (existingSpecialSender != null) {
      return setError(form, "localPartSender", "Aliaset finns redan");
    }
    const usernameInKeycloak = await keycloak.hasUsername(username);
    if (!usernameInKeycloak) {
      return setError(
        form,
        "usernameSender",
        "Användaren finns inte i Keycloak",
      );
    }
    const keycloakId = await keycloak.getUserId(username);
    if (keycloakId == null) {
      return setError(
        form,
        "usernameSender",
        "Användaren finns inte i Keycloak",
      );
    }
    await prisma.specialSender.create({
      data: {
        email,
        studentId: username,
        keycloakId,
      },
    });
    _handleUpdate();
    return message(form, {
      message: "E-postadressen skapad",
      type: "success",
    });
  },

  createEmailSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      createEmailSpecialReceiverSchema,
    );
    if (!form.valid) return fail(400, { form });
    const {
      localPartReceiver: localPart,
      domainReceiver: domain,
      targetEmailReceiver: targetEmail,
    } = form.data;
    const email = fuseEmail({
      localPart,
      domain,
    });
    if (email == null || !isValidEmail(email)) {
      return setError(form, "localPartReceiver", "Ogiltig e-postadress");
    }
    const existingEmailAlias = await prisma.emailAlias.findFirst({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias != null) {
      return setError(form, "localPartReceiver", "Aliaset finns redan");
    }
    const existingSpecialReceiver = await prisma.specialReceiver.findFirst({
      where: {
        email: email,
        targetEmail: targetEmail,
      },
    });
    if (existingSpecialReceiver != null) {
      return setError(form, "localPartReceiver", "Aliaset finns redan");
    }

    await prisma.specialReceiver.create({
      data: {
        email,
        targetEmail,
      },
    });
    _handleUpdate();
    return message(form, {
      message: "E-postadressen skapad",
      type: "success",
    });
  },
} satisfies Actions;
