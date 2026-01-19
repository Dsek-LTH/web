import apiNames from "$lib/utils/apiNames";
import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import { authorize, isAuthorized } from "$lib/utils/authorization";
import { getCurrentDoorPoliciesForMember } from "$lib/utils/member";
import { emptySchema, memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import { error, fail, isHttpError, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { sendPing } from "./pings";
import { dateToSemester } from "$lib/utils/semesters";
import { memberMedals } from "$lib/server/medals/medals";

export const load: PageServerLoad = async ({ locals, params, cookies }) => {
  const { prisma, user } = locals;
  const { studentId } = params;
  const [memberResult, publishedArticlesResult, phadderGroupsResult] =
    await Promise.allSettled([
      prisma.member.findUnique({
        where: {
          studentId: studentId,
        },
        include: {
          nollaIn: true,
          mandates: {
            include: {
              phadderIn: true,
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
          ...BASIC_ARTICLE_FILTER(),
          author: {
            type: {
              not: "Custom",
            },
            member: {
              studentId: studentId,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 5,
      }),
      prisma.phadderGroup.findMany({
        orderBy: {
          year: "asc",
        },
      }),
    ]);
  if (memberResult.status === "rejected")
    throw error(500, m.members_errors_couldntFetchMember());
  if (publishedArticlesResult.status === "rejected")
    throw error(500, m.members_errors_couldntFetchArticles());
  if (!memberResult.value) throw error(404, m.members_errors_memberNotFound());
  if (phadderGroupsResult.status === "rejected")
    throw error(505, phadderGroupsResult.reason);

  const member = memberResult.value;

  const showPhadderGroupModal =
    member.nollningGroupId === null &&
    cookies.get("phadder_group_modal_skipped") !== "1" &&
    cookies.get("phadder_group_modal_never") !== "1";

  const doorAccess =
    member.id === user?.memberId
      ? await getCurrentDoorPoliciesForMember(prisma, studentId)
      : [];

  const email =
    user.studentId === studentId ||
    isAuthorized(apiNames.MEMBER.SEE_EMAIL, user)
      ? member.email
      : undefined;

  try {
    return {
      form: await superValidate(member, zod4(memberSchema)),
      pingForm: await superValidate(zod4(emptySchema)),
      phadderGroupForm: await superValidate(member, zod4(phadderGroupSchema)),
      viewedMember: member, // https://github.com/Dsek-LTH/web/issues/194
      doorAccess,
      publishedArticles: publishedArticlesResult.value ?? [],
      email,
      medals: await memberMedals(
        prisma,
        member.id,
        dateToSemester(new Date()) - 1,
      ),
      phadderGroups: phadderGroupsResult.value,
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
      showPhadderGroupModal: showPhadderGroupModal,
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
    graduationYear: true,
    nollningGroupId: true,
    language: true,
  })
  .partial();

export type UpdateSchema = Infer<typeof updateSchema>;

const phadderGroupSchema = memberSchema
  .pick({
    classYear: true,
    nollningGroupId: true,
  })
  .partial()
  .extend({
    skipAction: z.enum(["skip", "never", "none"]).optional().default("none"),
  });
export type PhadderGroupSchema = Infer<typeof phadderGroupSchema>;

export const actions: Actions = {
  updateFoodPreference: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(
      request,
      zod4(z.object({ foodPreference: z.string() })),
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
  updatePhadderGroup: async ({ params, locals, request, cookies }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(phadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;

    switch (form.data.skipAction) {
      case "skip":
        cookies.set("phadder_group_modal_skipped", "1", {
          path: "/",
          maxAge: 12 * 60 * 60,
        });
        break;
      case "never":
        cookies.set("phadder_group_modal_never", "1", { path: "/" });
        break;
      default:
        await prisma.member.update({
          where: { studentId },
          data: {
            nollningGroupId: form.data.nollningGroupId ?? null,
          },
        });
        break;
    }

    if (form.data.nollningGroupId !== null)
      return message(form, {
        message: m.members_memberUpdated(),
        type: "success",
      });
    else return null;
  },
  update: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(updateSchema));
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
    const form = await superValidate(request, zod4(emptySchema));
    authorize(apiNames.MEMBER.PING, user);
    if (!user?.memberId) return fail(401, { form });

    const { studentId } = params;
    try {
      await sendPing(prisma, {
        link: `/members/${user.studentId}`, // link back to user who pinged
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
