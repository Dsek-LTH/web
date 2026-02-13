import translatedExtension from "../../database/prisma/translationExtension";
import loggingExtension from "../../database/prisma/loggingExtension";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { Locale } from "$paraglide/runtime";

export function getExtendedPrismaClient(lang: Locale, studentId?: string) {
  return authorizedPrismaClient
    .$extends(translatedExtension(lang))
    .$extends(loggingExtension(studentId));
}

export type ExtendedPrisma = ReturnType<typeof getExtendedPrismaClient>;

export type { ExtendedPrismaModel } from "../../database/prisma/translationExtension";
