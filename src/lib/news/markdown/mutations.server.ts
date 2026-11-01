import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { type ExtendedPrisma } from "$lib/server/extendedPrisma";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import type { AuthUser } from "@zenstackhq/runtime";
import { sanitizeHtml } from "$lib/utils/sanitize";

export const updateMarkdown = async (
  user: AuthUser,
  prisma: ExtendedPrisma,
  markdown: {
    name: string;
    markdownSv: string;
    markdownEn: string | null | undefined;
  },
) => {
  // we cannot do page-specific access in zenstack so we have to do it like this
  const prismaToUse = isAuthorized(
    apiNames.MARKDOWNS.PAGE(markdown.name).UPDATE,
    user,
  )
    ? authorizedPrismaClient
    : prisma;
  return await prismaToUse.markdown.update({
    where: {
      name: markdown.name,
    },
    data: {
      markdownSv: sanitizeHtml(markdown.markdownSv),
      markdownEn: markdown.markdownEn
        ? sanitizeHtml(markdown.markdownEn)
        : markdown.markdownEn,
    },
  });
};
