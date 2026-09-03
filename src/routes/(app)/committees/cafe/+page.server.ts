import type { PageServerLoad, Actions } from "./$types";
import { committeeLoad } from "../committee";
import { committeeActions } from "../committee.server";
import * as m from "$paraglide/messages";
import { error, fail, type NumericRange } from "@sveltejs/kit";
import { TimeSlot } from "./types";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { updateSchema } from "../types";
import { serverApi } from "$lib/server/apiClient";
import { editWeeklyCiabattaSchema, scheduleForm } from "./types";

// Week/ciabatta/opening-hours all now come from the Go cafe API (see
// backend/CLAUDE.md's Cafe routes section) - the old app's local dayjs
// weekOfYear-based week math (getWeek) and its three direct
// prisma.{markdown,cafeShift,ciabattaOfTheWeek} queries are gone, replaced
// by GET /cafe/schedule (which enforces the cafe:see_all_weeks viewing
// window server-side, same rule as before) and GET /cafe/opening-hours.
export const load: PageServerLoad = async (event) => {
  const { url, fetch } = event;
  const api = serverApi(event);

  const weekParam = url.searchParams.get("week");
  const yearParam = url.searchParams.get("year");

  const scheduleRes = await api.GET("/cafe/schedule", {
    params: {
      query: {
        ...(weekParam ? { week: Number(weekParam) } : {}),
        ...(yearParam ? { year: Number(yearParam) } : {}),
      },
    },
  });
  if (scheduleRes.error) {
    if (scheduleRes.response.status === 403) {
      error(403, { message: m.cafe_error_no_week_viewing_perms() });
    }
    error((scheduleRes.response.status as NumericRange<400, 599>) ?? 500, {
      message: "Failed to load cafe schedule",
    });
  }

  const [openingHoursRes, committeeData] = await Promise.all([
    api.GET("/cafe/opening-hours", {}),
    committeeLoad(fetch, "cafe", url),
  ]);

  return {
    ...committeeData,
    openingHours: openingHoursRes.data ?? [],
    shifts: scheduleRes.data.shifts,
    ciabattaOfTheWeek: scheduleRes.data.ciabatta ?? null,
    week: scheduleRes.data.week,
  };
};

export const actions: Actions = {
  ...committeeActions("cafe"),

  // Reuses the generic /info/{slug} markdown endpoint (Phase 3) instead of
  // a bespoke cafe-scoped write - the old action already just delegated to
  // the same generic updateMarkdown helper for whichever single page the
  // submitted form targeted, so this isn't a functionality reduction, just
  // dropping a redundant wrapper. See backend/CLAUDE.md's Cafe routes
  // section.
  updateHours: async (event) => {
    const { request } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });

    const { markdownSv, markdownEn, markdownSlug } = form.data;
    if (!markdownSlug || !markdownSv) {
      return fail(400, { form });
    }

    const res = await api.PATCH("/info/{slug}", {
      params: { path: { slug: markdownSlug } },
      body: { markdownSv, markdownEn: markdownEn ?? undefined },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },

  // Go's PUT /cafe/shifts collapses sign-up/quit/reassign into one
  // toggle-based endpoint (see internal/cafe.Service.SetShift's doc
  // comment) - this action just translates its result into the same
  // message keys the old prisma-based version used.
  updateSchedule: async (event) => {
    const { request, locals } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(scheduleForm));
    if (!form.valid) return fail(400, { form });

    const { date, worker, timeSlot } = form.data;
    const targetStudentId = worker || locals.user?.studentId || "";

    const res = await api.PUT("/cafe/shifts", {
      body: { date, timeSlot, studentId: worker || undefined },
    });

    if (res.error) {
      if (res.response.status === 403) {
        return message(form, {
          message:
            timeSlot === TimeSlot.DAYMANAGER
              ? m.cafe_error_only_daymanagers()
              : m.cafe_error_no_edit_worker_perms(),
          type: "error",
        });
      }
      return message(form, {
        message: m.cafe_error_worker_not_exist({ name: targetStudentId }),
        type: "error",
      });
    }

    const isSelf = targetStudentId === locals.user?.studentId;
    if (res.data.action === "quit") {
      return message(form, {
        message: isSelf
          ? m.cafe_quit_shift()
          : m.cafe_quit_shift_for_other({ name: targetStudentId }),
        type: "success",
      });
    }
    return message(form, {
      message: isSelf
        ? m.cafe_signed_up()
        : m.cafe_signed_up_for_other({ name: targetStudentId }),
      type: "success",
    });
  },

  editWeeklyCiabatta: async (event) => {
    const { request } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(editWeeklyCiabattaSchema));
    if (!form.valid) return fail(400, { form });

    const res = await api.PUT("/cafe/ciabatta", { body: form.data });
    if (res.error) {
      return message(form, {
        message: m.cafe_error_no_ciabatta_edit_perms(),
        type: "error",
      });
    }
    return message(form, {
      message: m.cafe_changed_ciabatta(),
      type: "success",
    });
  },
};
