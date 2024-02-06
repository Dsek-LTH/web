import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";

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
  const [emailAliasResult, allPositionsResult] = await Promise.allSettled([
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
  ]);
  if (emailAliasResult.status === "rejected") {
    throw fail(404, { message: "E-postadressen kunde inte hittas" });
  }
  if (allPositionsResult.status === "rejected") {
    throw fail(500, { message: "Kunde inte hämta positioner" });
  }

  const [
    removePositionForm,
    addPositionForm,
    deleteEmailAliasForm,
    setCanSendForm,
  ] = await Promise.all([
    superValidate(removePositionSchema),
    superValidate(addPositionSchema),
    superValidate(deleteEmailAliasSchema),
    superValidate(setCanSendSchema),
  ]);

  return {
    emailAlias: emailAliasResult.value,
    addPositionForm,
    removePositionForm,
    deleteEmailAliasForm,
    setCanSendForm,
    allPositions: allPositionsResult.value,
  };
};

export const actions = {
  deleteEmailAlias: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.DELETE, user);
    const { email } = event.params;
    await prisma.emailAlias.deleteMany({
      where: {
        email,
      },
    });
    throw redirect(
      "/admin/email-alias",
      {
        message: "Aliaset borttaget",
        type: "success",
      },
      event,
    );
  },
  removePosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const { email } = event.params;
    const form = await superValidate(event.request, removePositionSchema);
    if (!form.valid) return fail(400, { form });
    const { aliasId, positionId } = form.data;
    await prisma.emailAlias.delete({
      where: {
        id: aliasId,
        email,
        positionId,
      },
    });
    throw redirect(
      `/admin/email-alias/${email}`,
      {
        message: "Aliaset uppdaterat",
        type: "success",
      },
      event,
    );
  },
  addPosition: async (event) => {
    const { user, prisma } = event.locals;
    authorize([apiNames.EMAIL_ALIAS.CREATE, apiNames.EMAIL_ALIAS.UPDATE], user);
    const { email } = event.params;
    const form = await superValidate(event.request, addPositionSchema);
    if (!form.valid) return fail(400, { form });
    const { positionId } = form.data;
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
      `/admin/email-alias/${email}`,
      {
        message: "Aliaset uppdaterat",
        type: "success",
      },
      event,
    );
  },
  setCanSend: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.EMAIL_ALIAS.UPDATE, user);
    const form = await superValidate(event.request, setCanSendSchema);
    if (!form.valid) return fail(400, { form });
    const { aliasId, canSend } = form.data;
    console.log(form.data);
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
};

const removePositionSchema = z.object({
  email: z.string(),
  aliasId: z.string(),
  positionId: z.string(),
});

export type RemovePositionForm = typeof removePositionSchema;

const addPositionSchema = z.object({
  positionId: z.string(),
});

const deleteEmailAliasSchema = z.object({
  email: z.string(),
});

const setCanSendSchema = z.object({
  aliasId: z.string(),
  canSend: z.boolean(),
});

export type SetCanSendForm = typeof setCanSendSchema;
