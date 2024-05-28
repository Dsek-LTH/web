import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";

export const load: PageServerLoad = async ({ locals }) => {
  const { user, prisma } = locals;
  if (user?.memberId == null) throw redirect(302, "/home");

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
    .filter((type): type is string => type != null && type.length > 0);
  const subscribedTags = await prisma.member.findFirst({
    where: {
      id: user.memberId,
    },
    select: {
      subscribedTags: {},
    },
  });
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

    // Some error handling for the form data
    // The type received is FormDataEntryValue, which is string | File
    // Only string should be possible, but we make TS happy this way
    // And it doesn't hurt to check that the values are strings
    const push: string[] = [];
    for (const v of form.getAll("push")) {
      if (typeof v !== "string") return fail(400, { form });
      push.push(v);
    }
    const subscription: string[] = [];
    for (const v of form.getAll("subscription")) {
      if (typeof v !== "string") return fail(400, { form });
      subscription.push(v);
    }
    const tags: string[] = [];
    for (const v of form.getAll("tag")) {
      if (typeof v !== "string") return fail(400, { form });
      tags.push(v);
    }

    const memberId = user.memberId;
    if (memberId == null) return fail(400, { form });
    await prisma.subscriptionSetting.deleteMany({
      where: {
        memberId: memberId,
      },
    });
    await prisma.subscriptionSetting.createMany({
      data: subscription.map((sub) => {
        return {
          memberId: memberId,
          type: sub,
          pushNotification: push.find((tag) => sub == tag) ? true : false,
        };
      }),
    });
    await prisma.member.update({
      where: {
        id: memberId,
      },
      data: {
        subscribedTags: {
          set: tags.map((tag) => {
            return {
              id: tag,
            };
          }),
        },
      },
    });
  },
};
