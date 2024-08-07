import { emptySchema, memberSchema } from "$lib/zod/schemas";
import { error, fail, isHttpError, type NumericRange } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { sendPing } from "./pings";
import { getCurrentDoorPoliciesForMember } from "$lib/utils/member";
import keycloak from "$lib/server/keycloak";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const { studentId } = params;
  const [memberResult, publishedArticlesResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: studentId,
      },
      include: {
        mandates: {
          include: {
            position: {
              include: {
                committee: true,
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
          type: {
            not: "Custom",
          },
          member: {
            studentId: studentId,
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
    throw error(500, m.members_errors_couldntFetchMember());
  }
  if (publishedArticlesResult.status === "rejected") {
    throw error(500, m.members_errors_couldntFetchArticles());
  }
  if (!memberResult.value) {
    throw error(404, m.members_errors_memberNotFound());
  }
  const member = memberResult.value;

  const doorAccess =
    member.id === user?.memberId
      ? await getCurrentDoorPoliciesForMember(prisma, studentId)
      : [];

  const email =
    member.studentId !== null
      ? await keycloak.getEmail(member.studentId)
      : undefined;

  try {
    return {
      form: await superValidate(member, zod(memberSchema)),
      pingForm: await superValidate(zod(emptySchema)),
      viewedMember: member, // https://github.com/Dsek-LTH/web/issues/194
      doorAccess,
      publishedArticles: publishedArticlesResult.value ?? [],
      email,
      ping: user
        ? await prisma.ping.findFirst({
            where: {
              OR: [
                {
                  fromMemberId: member.id,
                  toMemberId: user.memberId,
                },
                {
                  fromMemberId: user.memberId,
                  toMemberId: member.id,
                },
              ],
            },
          })
        : null,
    };
  } catch {
    throw error(500, m.members_errors_couldntFetchPings());
  }
};

const updateSchema = memberSchema
  .pick({
    firstName: true,
    lastName: true,
    nickname: true,
    foodPreference: true,
    classProgramme: true,
    classYear: true,
  })
  .partial();

export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  updateFoodPreference: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(
      request,
      zod(z.object({ foodPreference: z.string() })),
    );
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    await prisma.member.update({
      where: { studentId },
      data: {
        foodPreference: form.data.foodPreference,
      },
    });
    return message(form, {
      message: m.members_memberUpdated(),
      type: "success",
    });
  },
  update: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    await prisma.member.update({
      where: { studentId },
      data: {
        ...form.data,
      },
    });
    return message(form, {
      message: m.members_memberUpdated(),
      type: "success",
    });
  },
  ping: async ({ params, locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(emptySchema));
    authorize(apiNames.MEMBER.PING, user);
    if (!user?.memberId) return fail(401, { form });

    const { studentId } = params;
    try {
      const url = new URL(request.url);
      await sendPing(prisma, {
        link: url.pathname,
        fromMemberId: { memberId: user.memberId! },
        toMemberId: { studentId },
      });
    } catch (e) {
      if (isHttpError(e)) {
        return message(
          form,
          {
            message: e.body.message,
            type: "error",
          },
          {
            status: e.status as NumericRange<400, 599>,
          },
        );
      }
      return message(form, {
        message: `${e}`,
        type: "error",
      });
    }
    return message(form, {
      message: m.members_pingSent(),
      type: "success",
    });
  },
};
