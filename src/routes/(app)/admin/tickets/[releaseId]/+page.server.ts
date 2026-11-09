import { loadRoster } from "./loadRoster";

export const load = async ({ params, locals, request }) => {
  const { user, prisma } = locals;
  return loadRoster(prisma, user, request, params.releaseId);
};
