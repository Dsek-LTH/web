import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const [memberResult, publishedArticlesResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: params.studentId,
      },
      include: {
        mandates: {
          include: {
            position: {
              include: {
                committee: {
                  select: {
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
        authoredEvents: {
          orderBy: {
            startDatetime: "desc",
          },
          take: 5,
        },
        doorAccessPolicies: {},
      },
    }),
    prisma.article.findMany({
      where: {
        author: {
          member: {
            studentId: params.studentId,
          },
        },
        removedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
    }),
  ]);
  if (memberResult.status === "rejected") {
    throw error(500, "Could not fetch member");
  }
  if (publishedArticlesResult.status === "rejected") {
    throw error(500, "Could not fetch articles");
  }
  if (!memberResult.value) {
    throw error(404, "Member not found");
  }
  const member = memberResult.value;
  const allDoorPolicies = await prisma.doorAccessPolicy.findMany({});

  const roles = member.doorAccessPolicies.map((d) => d.role).filter(notEmpty);
  const positions = (
    await prisma.position.findMany({
      where: {
        id: {
          in: roles,
        },
      },
    })
  ).concat(member.mandates.map((m) => m.position));

  // Map a doorname to roles, startDate and endDate
  const allMemberDoors = new Map<
    string,
    {
      roles: string[];
      startDate: Date | null;
      endDate: Date | null;
    }
  >();

  allDoorPolicies
    .filter((doorPolicy) =>
      member.mandates.some(
        (mandate) =>
          // A doorpolicy is associated with either a role or a specific member
          (doorPolicy.role !== null &&
            mandate.positionId.startsWith(doorPolicy.role)) ||
          doorPolicy.studentId === member.studentId,
      ),
    )
    .forEach((doorPolicy) => {
      // Get a nice name for a position instead of using the id
      const positionName =
        positions.find((position) => position.id === doorPolicy.role)?.name ??
        doorPolicy.role ??
        "Du";

      const old = allMemberDoors.get(doorPolicy.doorName);
      const newDoor = old ?? {
        roles: [positionName],
        startDate: doorPolicy.startDatetime,
        endDate: doorPolicy.endDatetime,
      };
      if (old) {
        newDoor.roles = old.roles.concat(positionName);
        newDoor.startDate = doorPolicy.startDatetime
          ? old.startDate === null || doorPolicy.startDatetime > old.startDate
            ? old.startDate
            : doorPolicy.startDatetime
          : null;
        newDoor.endDate = doorPolicy.endDatetime
          ? old.endDate === null || doorPolicy.endDatetime < old.endDate
            ? old.endDate
            : doorPolicy.endDatetime
          : null;
      }
      newDoor.roles = [...new Set(newDoor.roles)]; // remove duplicates
      allMemberDoors.set(doorPolicy.doorName, newDoor);
    });

  return {
    form: await superValidate(member, memberSchema),
    member,
    allMemberDoors,
    publishedArticles: publishedArticlesResult.value ?? [],
  };
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

const updateSchema = memberSchema.pick({
  firstName: true,
  lastName: true,
  nickname: true,
  foodPreference: true,
  classProgramme: true,
  classYear: true,
});

export type UpdateSchema = typeof updateSchema;

export const actions: Actions = {
  update: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    await prisma.member.update({
      where: { studentId },
      data: {
        ...form.data,
      },
    });
    return message(form, {
      message: "Medlem uppdaterad",
      type: "success",
    });
  },
};
