import type { Actions, PageServerLoadEvent } from "./$types";
import * as m from "$paraglide/messages";
import { error, fail, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { serverApi } from "$lib/server/apiClient";
import { TimeSlot, editWeeklyCiabattaSchema, scheduleForm } from "../types";

// Week math, the cafe:see_all_weeks viewing window, and every shift rule
// (day managers, sign-up/quit deadlines, editing others' shifts) are Go's
// (GET /cafe/schedule, POST /cafe/shifts/toggle, PUT /cafe/ciabattas/{year}/{week} - see
// backend/CLAUDE.md's Cafe routes section). The committee itself comes
// from the committees layout.
export const scheduleLoad = async (event: PageServerLoadEvent) => {
  const { url } = event;
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
    error(scheduleRes.response.status as NumericRange<400, 599>, {
      message: "Failed to load cafe schedule",
    });
  }

  return {
    shifts: scheduleRes.data.shifts ?? [],
    ciabattaOfTheWeek: scheduleRes.data.ciabatta ?? null,
    week: scheduleRes.data.week,
  };
};

export type ScheduleLoadData = Awaited<ReturnType<typeof scheduleLoad>>;

export const scheduleActions = (): Actions => ({
  // Go's POST /cafe/shifts/toggle collapses sign-up/quit/reassign into one
  // toggle-based endpoint (see internal/cafe.Service.SetShift's doc
  // comment) - this action just translates its result into the same
  // message keys the old prisma-based version used.
  updateSchedule: async (event) => {
    const { request, locals } = event;
    const form = await superValidate(request, zod4(scheduleForm));
    if (!form.valid) return fail(400, { form });

    const { date, worker, timeSlot } = form.data;
    const targetStudentId = worker || locals.user?.studentId || "";

    const res = await serverApi(event).POST("/cafe/shifts/toggle", {
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
      // Go's 422 details name the broken rule; map them back onto the
      // old messages.
      const detail = res.error.detail ?? "";
      const msg = detail.includes("does not exist")
        ? m.cafe_error_worker_not_exist({ name: targetStudentId })
        : detail.includes("in the past")
          ? m.cafe_error_sign_on_after()
          : detail.includes("already have a shift")
            ? m.cafe_error_already_have_shift()
            : detail.includes("too close")
              ? m.cafe_error_sign_off_close()
              : detail || m.cafe_error_no_edit_worker_perms();
      return message(form, { message: msg, type: "error" });
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
    const form = await superValidate(
      event.request,
      zod4(editWeeklyCiabattaSchema),
    );
    if (!form.valid) return fail(400, { form });

    const { year, week, name } = form.data;
    const res = await serverApi(event).PUT("/cafe/ciabattas/{year}/{week}", {
      params: { path: { year, week } },
      body: { name },
    });
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
});
