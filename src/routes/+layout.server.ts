import { getUserApis } from "$lib/utils/access";
import prisma from "$lib/utils/prisma";
import { loadFlash } from "sveltekit-flash-message/server";

export const load = loadFlash(async ({ locals }) => {
  const session = await locals.getSession();
  const accessPolicies = await getUserApis(session?.user);
  const currentMember = session?.user?.student_id
    ? await prisma.member.findUnique({
        where: {
          studentId: session.user.student_id,
        },
      })
    : null;
  return {
    session,
    accessPolicies,
    currentMember,
  };
});
