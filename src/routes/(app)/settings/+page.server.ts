import type { Actions, PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { fail, redirect } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import { settingsSchema } from "$lib/zod/schemas";

export const load: PageServerLoad = async ({ locals }) => {
  const { user, prisma } = locals;
  const subscriptionSettings = user
    ? await prisma.subscriptionSetting.findMany({
        where: {
          memberId: user.memberId,
        },
      })
    : [];
  const subscribedTags = user
    ? await prisma.member.findFirst({
        where: {
          id: user.memberId,
        },
        select: {
          subscribedTags: {},
        },
      })
    : [];
  return {
    tags: await prisma.tag.findMany(),
    subscribedTags,
    subscriptionSettings,
    form: await superValidate(settingsSchema),
  };
};

export const actions: Actions = {
  default: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, settingsSchema);
    if (!form.valid) return fail(400, { form });
    if (!user) return fail(401, { form });
    console.log(form.data.subscribedSettings);
    console.log(form.data.tags);
    await prisma.subscriptionSetting.deleteMany({
      where: {
        memberId: user.memberId,
      },
    });
    await prisma.subscriptionSetting.createMany({
      data: form.data.subscribedSettings.map((sub) => {
        return {
          memberId: user.memberId as string,
          type: sub.type,
          pushNotification: sub.pushNotification,
          member: {
            connect: {
              id: user.memberId,
            },
          },
        };
      }),
    });
    await prisma.member.update({
      where: {
        id: user.memberId as string,
      },
      data: {
        subscribedTags: {
          set: form.data.tags.map((tag) => {
            return {
              id: tag.id,
            };
          }),
        },
      },
    });
  },
};
