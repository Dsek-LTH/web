import type { PageServerLoad } from "./$types";

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
    ? await prisma.member.findUnique({
        where: {
          id: user.memberId,
        },
        select: {
          subscribedTags: true,
        },
      })
    : [];
  return {
    tags: await prisma.tag.findMany(),
    subscribedTags,
    subscriptionSettings,
  };
};
