import { message, setError, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";
import {
  createEmailPositionSchema,
  createEmailSpecialSenderSchema,
  createEmailSpecialReceiverSchema,
} from "./schema";
import { fuseEmail, getEmailDomains, isValidGuildEmail } from "./emailutils";
import { fail, type Actions } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import authentik from "$lib/server/authentik";
import * as m from "$paraglide/messages";
export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const [
    createEmailPositionForm,
    createEmailSpecialSenderForm,
    createEmailSpecialReceiverForm,
  ] = await Promise.all([
    await superValidate(event.request, zod(createEmailPositionSchema)),
    await superValidate(event.request, zod(createEmailSpecialSenderSchema)),
    await superValidate(event.request, zod(createEmailSpecialReceiverSchema)),
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
    const form = await superValidate(
      event.request,
      zod(createEmailPositionSchema),
    );
    if (!form.valid) return fail(400, { form });
    const {
      localPartAlias: localPart,
      positionIdAlias: positionId,
      domainAlias: domain,
    } = form.data;
    if (!getEmailDomains().includes(domain)) {
      return setError(form, "domainAlias", m.admin_emailalias_invalidDomain());
    }
    const email = fuseEmail({
      localPart,
      domain,
    });
    if (email == null || !isValidGuildEmail(email)) {
      return setError(
        form,
        "localPartAlias",
        m.admin_emailalias_invalidAddress(),
      );
    }
    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
      },
    });
    if (position == null) {
      return setError(
        form,
        "positionIdAlias",
        m.admin_emailalias_nonexistentPosition(),
      );
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
      return setError(
        form,
        "localPartAlias",
        m.admin_emailalias_aliasAlreadyExists(),
      );
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
    return message(form, {
      message: m.admin_emailalias_addressCreated(),
      type: "success",
    });
  },

  createEmailSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      zod(createEmailSpecialSenderSchema),
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
    if (email == null || !isValidGuildEmail(email)) {
      return setError(
        form,
        "localPartSender",
        m.admin_emailalias_invalidAddress(),
      );
    }
    const existingEmailAlias = await prisma.emailAlias.findFirst({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias != null) {
      return setError(
        form,
        "localPartSender",
        m.admin_emailalias_aliasAlreadyExists(),
      );
    }
    const existingSpecialSender = await prisma.specialSender.findFirst({
      where: {
        email: email,
      },
    });
    if (existingSpecialSender != null) {
      return setError(
        form,
        "localPartSender",
        m.admin_emailalias_aliasAlreadyExists(),
      );
    }
    const usernameInAuthentik = await authentik.hasUsername(username);
    if (!usernameInAuthentik) {
      return setError(
        form,
        "usernameSender",
        m.admin_emailalias_userNotInAuthentik(),
      );
    }
    const authentikId = await authentik.getUserId(username);
    if (authentikId == null) {
      return setError(
        form,
        "usernameSender",
        m.admin_emailalias_userNotInAuthentik(),
      );
    }
    await prisma.specialSender.create({
      data: {
        email,
        studentId: username,
        keycloakId: authentikId,
      },
    });
    return message(form, {
      message: m.admin_emailalias_addressCreated(),
      type: "success",
    });
  },

  createEmailSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      zod(createEmailSpecialReceiverSchema),
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
    if (email == null || !isValidGuildEmail(email)) {
      return setError(
        form,
        "localPartReceiver",
        m.admin_emailalias_invalidAddress(),
      );
    }
    const existingEmailAlias = await prisma.emailAlias.findFirst({
      where: {
        email: email,
      },
    });
    if (existingEmailAlias != null) {
      return setError(
        form,
        "localPartReceiver",
        m.admin_emailalias_aliasAlreadyExists(),
      );
    }
    const existingSpecialReceiver = await prisma.specialReceiver.findFirst({
      where: {
        email: email,
        targetEmail: targetEmail,
      },
    });
    if (existingSpecialReceiver != null) {
      return setError(
        form,
        "localPartReceiver",
        m.admin_emailalias_aliasAlreadyExists(),
      );
    }

    await prisma.specialReceiver.create({
      data: {
        email,
        targetEmail,
      },
    });
    return message(form, {
      message: m.admin_emailalias_addressCreated(),
      type: "success",
    });
  },
} satisfies Actions;
