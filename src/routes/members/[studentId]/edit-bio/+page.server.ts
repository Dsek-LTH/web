import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, parent }) => {
  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, "Member not found");
  }
  const { session } = await parent();
  await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId: params.studentId });
  return {
    member,
  };
};

export const actions = {
  update: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId: params.studentId });
    const studentId = params.studentId;
    const formData = await request.formData();
    const bio = (formData.get("bio") as string | null) ?? undefined;
    if (!bio || typeof bio !== "string")
      return fail(400, {
        error: "Invalid bio",
        data: Object.fromEntries(formData),
      });

    try {
      await prisma.member.update({
        where: { studentId },
        data: {
          bio: bio,
        },
      });
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Member not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
};
