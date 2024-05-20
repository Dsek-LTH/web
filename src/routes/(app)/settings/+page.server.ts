import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ locals }) => {
  const { user, prisma } = locals;
  authorize(apiNames.MEMBER.UPDATE, user);

  const subscriptionSettings = user
    ? await prisma.subscriptionSetting.findMany({
        where: {
          memberId: user.memberId,
        },
      })
    : [];

  const subscriptions = subscriptionSettings.map((sub) => sub.type);
  const pushSubscriptions = subscriptionSettings
    .map((sub) => {
      if (sub.pushNotification) return sub.type;
    })
    .filter((t) => t);
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
    subscriptions,
    pushSubscriptions,
  };
};

export const actions: Actions = {
  default: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await request.formData();
    if (!user) return fail(401, { form });
    const subscription: FormDataEntryValue[] = form.getAll("subscription");
    const push: FormDataEntryValue[] = form.getAll("push");
    const tags: FormDataEntryValue[] = form.getAll("tag");

    // Try-catch if for some reason form data isn't correct
    try {
      await prisma.subscriptionSetting.deleteMany({
        where: {
          memberId: user.memberId,
        },
      });
      await prisma.subscriptionSetting.createMany({
        data: subscription.map((sub) => {
          return {
            memberId: user.memberId as string,
            type: sub.toString(),
            pushNotification: push.find(
              (tag) => sub.toString() == tag.toString(),
            )
              ? true
              : false,
          };
        }),
      });
      await prisma.member.update({
        where: {
          id: user.memberId as string,
        },
        data: {
          subscribedTags: {
            set: tags.map((tag) => {
              return {
                id: tag.toString(),
              };
            }),
          },
        },
      });
    } catch {
      return fail(400, { form });
    }
  },
};
