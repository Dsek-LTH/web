import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import {
  addPositionSchema,
  addSpecialReceiverSchema,
  addSpecialSenderSchema,
  deleteEmailAliasSchema,
  deleteSpecialReceiverSchema,
  deleteSpecialSenderSchema,
  removePositionSchema,
  removeSpecialReceiverSchema,
  removeSpecialSenderSchema,
  setCanSendSchema,
} from "./schema";
import { isValidEmail, isValidGuildEmail } from "../emailutils";
import authentik from "$lib/server/authentik";
import type { PrismaClient } from "@prisma/client";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async (event) => {
  const { user, prisma } = event.locals;
  authorize(
    [
      apiNames.EMAIL_ALIAS.CREATE,
      apiNames.EMAIL_ALIAS.READ,
      apiNames.EMAIL_ALIAS.UPDATE,
      apiNames.EMAIL_ALIAS.DELETE,
    ],
    user,
  );
  const { email } = event.params;
  const [
    emailAliasResult,
    allPositionsResult,
    specialReceiverResult,
    specialSenderResult,
  ] = await Promise.allSettled([
    prisma.emailAlias.findMany({
      where: {
        email,
      },
      include: {
        position: true,
      },
      orderBy: {
        positionId: "asc",
      },
    }),
    prisma.position.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.specialReceiver.findMany({
      where: {
        email,
      },
      orderBy: {
        targetEmail: "asc",
      },
    }),
    prisma.specialSender.findMany({
      where: {
        email,
      },
      orderBy: {
        studentId: "asc",
      },
    }),
  ]);
  if (
    emailAliasResult.status === "rejected" ||
    specialReceiverResult.status === "rejected" ||
    specialSenderResult.status === "rejected"
  ) {
    throw error(404, { message: m.admin_emailalias_addressNotFound() });
  }
  if (allPositionsResult.status === "rejected") {
    throw error(500, { message: m.admin_emailalias_couldNotFetchPositions() });
  }

  const [
    addPositionForm,
    removePositionForm,
    setCanSendForm,
    deleteEmailAliasForm,
    addSpecialReceiverForm,
    removeSpecialReceiverForm,
    deleteSpecialReceiverForm,
    addSpecialSenderForm,
    removeSpecialSenderForm,
    deleteSpecialSenderForm,
  ] = await Promise.all([
    superValidate(zod(addPositionSchema)),
    superValidate(zod(removePositionSchema)),
    superValidate(zod(setCanSendSchema)),
    superValidate(zod(deleteEmailAliasSchema)),
    superValidate(zod(addSpecialReceiverSchema)),
    superValidate(zod(removeSpecialReceiverSchema)),
    superValidate(zod(deleteSpecialReceiverSchema)),
    superValidate(zod(addSpecialSenderSchema)),
    superValidate(zod(removeSpecialSenderSchema)),
    superValidate(zod(deleteSpecialSenderSchema)),
  ]);

  const emailAliases = emailAliasResult.value;
  const specialReceiver = specialReceiverResult.value;
  const specialSender = specialSenderResult.value;
  if (
    emailAliases.length === 0 &&
    specialReceiver.length === 0 &&
    specialSender.length === 0
  ) {
    throw error(404, { message: m.admin_emailalias_addressNotFound() });
  }

  return {
    emailAlias: emailAliases,
    allPositions: allPositionsResult.value,
    specialReceivers: specialReceiver,
    specialSenders: specialSender,
    addPositionForm,
    removePositionForm,
    setCanSendForm,
    deleteEmailAliasForm,
    addSpecialReceiverForm,
    removeSpecialReceiverForm,
    deleteSpecialReceiverForm,
    addSpecialSenderForm,
    removeSpecialSenderForm,
    deleteSpecialSenderForm,
  };
};

export const actions = {
  deleteEmailAlias: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      zod(deleteEmailAliasSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.emailAlias.deleteMany({
      where: {
        email,
      },
    });
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: m.admin_emailalias_aliasRemoved(),
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: m.admin_emailalias_aliasRemoved(),
          type: "success",
        },
        event,
      );
    }
  },
  addPosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize([apiNames.EMAIL_ALIAS.CREATE, apiNames.EMAIL_ALIAS.UPDATE], user);
    const form = await superValidate(event.request, zod(addPositionSchema));
    if (!form.valid) return fail(400, { form });
    const { positionId, email } = form.data;
    if (!isValidGuildEmail(email)) {
      return setError(form, "email", m.admin_emailalias_invalidAddress());
    }
    const existingAlias = await prisma.emailAlias.findFirst({
      where: {
        email,
        positionId,
      },
    });
    if (existingAlias) {
      return setError(
        form,
        "positionId",
        m.admin_emailalias_positionAlreadyExists(),
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
      message: m.admin_emailalias_positionAdded(),
      type: "success",
    });
  },
  removePosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const form = await superValidate(event.request, zod(removePositionSchema));
    if (!form.valid) return fail(400, { form });
    const { aliasId } = form.data;
    await prisma.emailAlias.delete({
      where: {
        id: aliasId,
      },
    });
    return message(form, {
      message: m.admin_emailalias_positionRemoved(),
      type: "success",
    });
  },
  setCanSend: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const form = await superValidate(event.request, zod(setCanSendSchema));
    if (!form.valid) return fail(400, { form });
    const { aliasId, canSend } = form.data;
    await prisma.emailAlias.update({
      where: {
        id: aliasId,
      },
      data: {
        canSend,
      },
    });
    return message(form, {
      message: m.admin_emailalias_positionRightsUpdated(),
      type: "success",
    });
  },
  deleteSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      zod(deleteEmailAliasSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.specialReceiver.deleteMany({
      where: {
        email,
      },
    });
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: m.admin_emailalias_specialReceiversRemoved(),
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: m.admin_emailalias_specialReceiversRemoved(),
          type: "success",
        },
        event,
      );
    }
  },
  addSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      zod(addSpecialReceiverSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { email, targetEmailReceiver } = form.data;
    if (!isValidEmail(targetEmailReceiver)) {
      return setError(
        form,
        "targetEmailReceiver",
        m.admin_emailalias_invalidAddress(),
      );
    }
    await prisma.specialReceiver.create({
      data: {
        email,
        targetEmail: targetEmailReceiver,
      },
    });
    return message(form, {
      message: m.admin_emailalias_specialReceiverAdded(),
      type: "success",
    });
  },
  removeSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      zod(removeSpecialReceiverSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.specialReceiver.delete({
      where: {
        id,
      },
    });
    return message(form, {
      message: m.admin_emailalias_specialReceiversRemoved(),
      type: "success",
    });
  },
  deleteSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      zod(deleteEmailAliasSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.specialSender.deleteMany({
      where: {
        email,
      },
    });
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: m.admin_emailalias_specialSendersRemoved(),
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: m.admin_emailalias_specialReceiversRemoved(),
          type: "success",
        },
        event,
      );
    }
  },
  addSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(
      event.request,
      zod(addSpecialSenderSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { email, usernameSender } = form.data;
    if (!isValidGuildEmail(email)) {
      return setError(form, "email", m.admin_emailalias_invalidAddress());
    }
    if (!(await authentik.hasUsername(usernameSender))) {
      return setError(
        form,
        "usernameSender",
        m.admin_emailalias_userNotInAuthentik(),
      );
    }
    const authentikId = await authentik.getUserId(usernameSender);
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
        studentId: usernameSender,
        keycloakId: authentikId,
      },
    });
    return message(form, {
      message: m.admin_emailalias_specialSenderAdded(),
      type: "success",
    });
  },
  removeSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      zod(removeSpecialSenderSchema),
    );
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.specialSender.delete({
      where: {
        id,
      },
    });
    return message(form, {
      message: m.admin_emailalias_specialSenderAdded(),
      type: "success",
    });
  },
};

// An email alias might be used for a position, a special receiver or a special sender
// This function checks if an email alias is used for any of these
// If it is, it should not be deleted, and thus there should still be a page for that email
async function emailStillInUse(
  prisma: PrismaClient,
  email: string,
): Promise<boolean> {
  const [aliasCount, receiverCount, senderCount] = await Promise.all([
    prisma.emailAlias.count({
      where: {
        email,
      },
    }),
    prisma.specialReceiver.count({
      where: {
        email,
      },
    }),
    prisma.specialSender.count({
      where: {
        email,
      },
    }),
  ]);
  return aliasCount + receiverCount + senderCount > 0;
}
