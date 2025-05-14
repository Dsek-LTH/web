import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params }) => {
  const { studentId } = params;
  const { prisma } = locals;

  const userInfo = await prisma.member.findUnique({
    where: {
      studentId,
    },
    select: {
      picturePath: true,
    },
  });

  return new Response(JSON.stringify({ picture: userInfo?.picturePath }));
};
