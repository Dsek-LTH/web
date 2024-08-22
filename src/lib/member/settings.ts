import { getAllTags } from "$lib/news/tags";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail, type RequestEvent, type ServerLoadEvent } from "@sveltejs/kit";

export const settingsLoad = async ({ locals }: ServerLoadEvent) => {
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
    tags: await getAllTags(prisma),
    subscribedTags,
    subscriptions,
    pushSubscriptions,
  };
};

export type SettingsPageData = Awaited<ReturnType<typeof settingsLoad>>;

export const settingsActions = {
  default: async ({ locals, request }: RequestEvent) => {
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
