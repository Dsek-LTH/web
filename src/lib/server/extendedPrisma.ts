import translatedExtension from "../../database/prisma/translationExtension";
import loggingExtension from "../../database/prisma/loggingExtension";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { AvailableLanguageTag } from "$paraglide/runtime";

export function extendedPrisma(lang: AvailableLanguageTag, studentId?: string) {
  return authorizedPrismaClient.$extends(translatedExtension(lang)).$extends(loggingExtension(studentId));
}

export type ExtendedPrisma = ReturnType<typeof extendedPrisma>;