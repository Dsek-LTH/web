import { command, getRequestEvent } from "$app/server";
import { setLocale } from "$paraglide/runtime";
import z from "zod";

export const setLanguage = command(
  z.string().refine((s) => s === "sv" || s === "en"),
  async (lang) => {
    const {
      locals: { prisma, user },
    } = getRequestEvent();
    if (user.studentId) {
      await prisma.member.update({
        where: { studentId: user?.studentId },
        data: { language: lang },
      });
    }
    setLocale(lang);
  },
);
