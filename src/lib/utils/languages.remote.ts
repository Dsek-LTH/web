import { command, getRequestEvent } from "$app/server";
import { i18n } from "$lib/utils/i18n";
import { setLanguageTag } from "$paraglide/runtime";
import z from "zod";

export const setLanguage = command(
  z.string().refine((s) => s === "sv" || s === "en"),
  async (lang) => {
    const {
      locals: { prisma, user },
      url,
    } = getRequestEvent();
    await prisma.member.update({
      where: { studentId: user?.studentId },
      data: { language: lang },
    });
    setLanguageTag(lang);
    return {
      redirect: i18n.resolveRoute(i18n.route(url.pathname ?? ""), lang),
    };
  },
);
