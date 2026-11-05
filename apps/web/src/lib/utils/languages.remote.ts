import { command, getRequestEvent } from "$app/server";
import { serverApi } from "$lib/server/apiClient";
import { setLocale } from "$paraglide/runtime";
import z from "zod";

export const setLanguage = command(z.enum(["sv", "en"]), async (lang) => {
  const event = getRequestEvent();
  const studentId = event.locals.user?.studentId;
  if (studentId) {
    await serverApi(event).PUT("/members/{studentId}/language", {
      params: { path: { studentId } },
      body: { language: lang },
    });
  }
  setLocale(lang);
});
