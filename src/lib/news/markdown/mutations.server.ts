import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import DOMPurify from "isomorphic-dompurify";

export const updateMarkdown = async (
  user: AuthUser,
  prisma: PrismaClient,
  markdown: {
    name: string;
    markdown: string;
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
      markdown: DOMPurify.sanitize(markdown.markdown),
      markdownEn: markdown.markdownEn
        ? DOMPurify.sanitize(markdown.markdownEn)
        : markdown.markdownEn,
    },
  });
};
