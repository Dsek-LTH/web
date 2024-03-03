import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
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
import { isValidEmail } from "../emailutils";
import keycloak from "$lib/server/keycloak/keycloak";
import type { PrismaClient } from "@prisma/client";
import { mailAliasUpdateHandler } from "$lib/server/mail/alias/mailAliasUpdateHandler";

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
    throw error(404, { message: "E-postadressen kunde inte hittas" });
  }
  if (allPositionsResult.status === "rejected") {
    throw error(500, { message: "Kunde inte hämta positioner" });
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
    superValidate(addPositionSchema),
    superValidate(removePositionSchema),
    superValidate(setCanSendSchema),
    superValidate(deleteEmailAliasSchema),
    superValidate(addSpecialReceiverSchema),
    superValidate(removeSpecialReceiverSchema),
    superValidate(deleteSpecialReceiverSchema),
    superValidate(addSpecialSenderSchema),
    superValidate(removeSpecialSenderSchema),
    superValidate(deleteSpecialSenderSchema),
  ]);

  const emailAliases = emailAliasResult.value;
  const specialReceiver = specialReceiverResult.value;
  const specialSender = specialSenderResult.value;
  if (
    emailAliases.length === 0 &&
    specialReceiver.length === 0 &&
    specialSender.length === 0
  ) {
    throw error(404, { message: "E-postadressen kunde inte hittas" });
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
    const form = await superValidate(event.request, deleteEmailAliasSchema);
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.emailAlias.deleteMany({
      where: {
        email,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: "Aliaset borttaget",
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: "Aliaset borttaget",
          type: "success",
        },
        event,
      );
    }
  },
  addPosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize([apiNames.EMAIL_ALIAS.CREATE, apiNames.EMAIL_ALIAS.UPDATE], user);
    const form = await superValidate(event.request, addPositionSchema);
    if (!form.valid) return fail(400, { form });
    const { positionId, email } = form.data;
    if (!isValidEmail(email)) {
      return setError(form, "email", "E-postadressen är inte giltig");
    }
    const existingAlias = await prisma.emailAlias.findFirst({
      where: {
        email,
        positionId,
      },
    });
    if (existingAlias) {
      return setError(form, "positionId", "Positionen finns redan");
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
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Positionen tillagd",
      type: "success",
    });
  },
  removePosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const form = await superValidate(event.request, removePositionSchema);
    if (!form.valid) return fail(400, { form });
    const { aliasId } = form.data;
    await prisma.emailAlias.delete({
      where: {
        id: aliasId,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Positionen borttagen",
      type: "success",
    });
  },
  setCanSend: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const form = await superValidate(event.request, setCanSendSchema);
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
      message: "Postens rättigheter uppdaterade",
      type: "success",
    });
  },
  deleteSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(event.request, deleteEmailAliasSchema);
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.specialReceiver.deleteMany({
      where: {
        email,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: "Special receivers borttagna",
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: "Special receivers borttagna",
          type: "success",
        },
        event,
      );
    }
  },
  addSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(event.request, addSpecialReceiverSchema);
    if (!form.valid) return fail(400, { form });
    const { email, targetEmailReceiver } = form.data;
    if (!isValidEmail(targetEmailReceiver)) {
      return setError(
        form,
        "targetEmailReceiver",
        "E-postadressen är inte giltig",
      );
    }
    await prisma.specialReceiver.create({
      data: {
        email,
        targetEmail: targetEmailReceiver,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Special receiver tillagd",
      type: "success",
    });
  },
  removeSpecialReceiver: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(
      event.request,
      removeSpecialReceiverSchema,
    );
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.specialReceiver.delete({
      where: {
        id,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Special receiver borttagen",
      type: "success",
    });
  },
  deleteSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(event.request, deleteEmailAliasSchema);
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    await prisma.specialSender.deleteMany({
      where: {
        email,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    if (await emailStillInUse(prisma, email)) {
      return message(form, {
        message: "Special senders borttagna",
        type: "success",
      });
    } else {
      throw redirect(
        "/admin/email-alias",
        {
          message: "Special senders borttagna",
          type: "success",
        },
        event,
      );
    }
  },
  addSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, user);
    const form = await superValidate(event.request, addSpecialSenderSchema);
    if (!form.valid) return fail(400, { form });
    const { email, usernameSender } = form.data;
    if (!isValidEmail(email)) {
      return setError(form, "email", "E-postadressen är inte giltig");
    }
    if (!(await keycloak.hasUsername(usernameSender))) {
      return setError(
        form,
        "usernameSender",
        "Användaren finns inte i Keycloak",
      );
    }
    const keycloakId = await keycloak.getUserId(usernameSender);
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
        studentId: usernameSender,
        keycloakId: keycloakId,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Special sender tillagd",
      type: "success",
    });
  },
  removeSpecialSender: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const form = await superValidate(event.request, removeSpecialSenderSchema);
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.specialSender.delete({
      where: {
        id,
      },
    });
    mailAliasUpdateHandler.handleUpdate();
    return message(form, {
      message: "Special sender borttagen",
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
