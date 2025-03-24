import { getAllTags } from "$lib/news/tags";
import {
  error,
  fail,
  type RequestEvent,
  type ServerLoadEvent,
} from "@sveltejs/kit";

export const settingsLoad = async ({ locals }: ServerLoadEvent) => {
  const { user, prisma } = locals;
  if (!user.memberId)
    throw error(401, "Du måste logga in för att ändra inställningar");

  const subscriptionSettings = await prisma.subscriptionSetting.findMany({
    where: {
      memberId: user.memberId,
    },
  });

  const subscriptions = subscriptionSettings.map((sub) => sub.type);
  const pushSubscriptions = subscriptionSettings
    .map((sub) => {
      if (sub.pushNotification) return sub.type;
    })
    .filter((t) => t);
  const subscribedTags = await prisma.member.findFirst({
    where: {
      id: user.memberId,
    },
    select: {
      subscribedTags: {},
    },
  });
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
      await prisma.$transaction(async (tx) => {
        await tx.subscriptionSetting.deleteMany({
          where: {
            memberId: user.memberId,
          },
        });
        const res = await tx.subscriptionSetting.createMany({
          data: subscription.map((sub) => {
            return {
              memberId: user.memberId as string,
              type: sub.toString(),
              pushNotification: push.some(
                (tag) => sub.toString() === tag.toString(),
              ),
            };
          }),
        });
        if (res.count !== subscription.length) {
          // If nbr created isn't the same as number of subscribed tags, something went wrong, do rollback
          throw new Error(
            `${res.count} created but supposed to be ${subscription.length}`,
          );
        }
      });
      prisma.member.update({
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
    } catch (error) {
      console.log(error);
      return fail(400, { form });
    }
  },
};
