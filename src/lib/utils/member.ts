import {
  DEFAULT_SUBSCRIPTION_SETTINGS,
  NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS,
} from "$lib/utils/notifications/types";
import { getDerivedRoles } from "./authorization";
import type { serverApi } from "$lib/server/apiClient";
import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

export const getCustomAuthorOptions = async (
  prisma: ExtendedPrisma,
  memberId: string,
) => {
  const activePositionIds = await prisma.position
    .findMany({
      select: {
        id: true,
      },
      where: {
        mandates: {
          some: {
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
            memberId,
          },
        },
      },
    })
    .then((positions) => positions.map((pos) => pos.id));
  return await prisma.customAuthor.findMany({
    where: {
      roles: {
        some: {
          role: {
            in: getDerivedRoles(activePositionIds, !!memberId),
          },
        },
      },
    },
  });
};

/**
 * Create a member with default settings for notifications and tag subscriptions
 */
export const createMember = async (
  prisma: ExtendedPrisma,
  data: {
    studentId: string;
    firstName: string;
    lastName: string;
    email: string | null | undefined;
  },
  api: ReturnType<typeof serverApi>,
) => {
  // Boolean source only, swapped from the old AdminSetting-backed
  // isNollningPeriod() - see backend's Phase 2 nollning redesign. The
  // NOLLNING_TAG_PREFIX tag lookup and SubscriptionSetting defaulting
  // below stay untouched; that's notification/subscription territory,
  // Phase 9's job per DESIGN.md, not this pass's.
  const currentRes = await api.GET("/nollning/current", {});
  if (currentRes.data && currentRes.data.phase !== "off") {
    const defaultTag = await prisma.tag.findFirst({
      where: {
        nameSv: {
          startsWith: NOLLNING_TAG_PREFIX,
        },
      },
    });
    return await prisma.member.create({
      data: {
        ...data,
        classYear: new Date().getFullYear(),
        subscriptionSettings: {
          createMany: {
            data: NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS,
          },
        },
        subscribedTags: {
          connect: defaultTag ? { id: defaultTag.id } : undefined,
        },
      },
    });
  }
  const defaultTags = await prisma.tag.findMany({
    where: {
      isDefault: true,
    },
  });
  return await prisma.member.create({
    data: {
      ...data,
      classYear: new Date().getFullYear(),
      subscriptionSettings: {
        createMany: {
          data: DEFAULT_SUBSCRIPTION_SETTINGS,
        },
      },
      subscribedTags: {
        connect: defaultTags.map((tag) => ({ id: tag.id })),
      },
    },
  });
};

// Sets/clears a member's phadder group. A member can only be in one group
// at a time (members.nollning_group_id is a single column), so setting a
// new group is just a POST - no need to DELETE-from-old first, Go's
// SetMemberPhadderGroup overwrites unconditionally. Clearing to null does
// need the member's current group id first, since DELETE is scoped to
// "remove from exactly this group" (a no-op if they're not in it). Shared
// by the member profile/edit/onboarding pages' phadder-group actions.
export const setNollningGroup = async (
  api: ReturnType<typeof serverApi>,
  studentId: string,
  groupId: string | null,
) => {
  const memberRes = await api.GET("/members/{studentId}", {
    params: { path: { studentId } },
  });
  if (memberRes.error) return;
  const memberId = memberRes.data.id;

  if (groupId) {
    await api.POST("/nollning/groups/{id}/nollor", {
      params: { path: { id: groupId } },
      body: { memberId },
    });
    return;
  }

  const roleRes = await api.GET("/members/{studentId}/phadder-role", {
    params: { path: { studentId } },
  });
  const currentGroupId =
    roleRes.data?.role === "nolla" ? roleRes.data.groupId : undefined;
  if (currentGroupId) {
    await api.DELETE("/nollning/groups/{id}/nollor/{memberId}", {
      params: { path: { id: currentGroupId, memberId } },
    });
  }
};
