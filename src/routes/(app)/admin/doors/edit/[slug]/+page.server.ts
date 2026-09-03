import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { error, fail } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import { serverApi } from "$lib/server/apiClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// core:access:door:create/delete (Go's apinames.DoorCreate/DoorDelete) are
// enforced by the Go API itself - see backend/internal/doors. No
// authorize() call here, matching DESIGN.md's Principle #5. The old app's
// createSchema also validated "does this member/role actually exist" via a
// direct Prisma query in an async .refine() - that check now lives
// server-side in Go (Service.CreateAccessPolicy) instead, per DESIGN.md's
// "no validation logic re-implemented in TypeScript" principle; the create
// action below surfaces Go's rejection back onto the subject field the same
// way committees/nollu/groups/manage's addNolla/addPhadder actions already
// do for an equivalent Go-side existence check.
export const load: PageServerLoad = async (event) => {
  const { params, parent } = event;
  const { doors } = await parent();
  const door = doors.find((door) => door.name === params.slug);

  if (!door) error(404, m.admin_doors_notFound());

  const res = await serverApi(event).GET("/doors/{name}/access-policies", {
    params: { path: { name: params.slug } },
  });
  if (res.error) throw new Error("Failed to load door access policies");

  return {
    door,
    doorAccessPolicies: res.data ?? [],
    createForm: await superValidate(zod4(createSchema)),
  };
};

const createSchema = z
  .object({
    subject: z.string().min(1),
    type: z.enum(["member", "role"]).default("member"),
    mode: z.enum(["allow", "deny"]).default("allow"),
    startDatetime: z.iso.datetime({ local: true }).optional(),
    endDatetime: z.iso.datetime({ local: true }).optional(),
    reason: z.string().optional(),
  })
  // These refinements return true for valid data, but it's
  // easier to express them in terms of what is invalid.
  .refine(
    // Require the start date to be before the end date
    ({ startDatetime: start, endDatetime: end }) =>
      !(start && end && dayjs(end).isBefore(start)),
    { message: m.admin_doors_endDateBeforeStart(), path: ["endDatetime"] },
  )
  .refine(
    // Require an end date for member rules
    (data) => !(data.type === "member" && !data.endDatetime),
    { message: m.admin_doors_memberRuleRequireEnd(), path: ["endDatetime"] },
  )
  .refine(
    // Require a reason for member rules
    (data) => !(data.type === "member" && !data.reason),
    { message: m.admin_doors_memberRuleRequireReason(), path: ["reason"] },
  )
  .refine(
    // Require a reason for bans
    (data) => !(data.mode === "deny" && !data.reason),
    { message: m.admin_doors_banRuleRequireReason(), path: ["reason"] },
  )
  .refine(
    // Banning groups is not implemented (Go rejects this too - see
    // Service.CreateAccessPolicy - this refine just gives instant
    // client-side feedback instead of a round-trip).
    (data) => !(data.type === "role" && data.mode === "deny"),
    { message: "Not implemented", path: ["mode"] },
  );

const deleteSchema = z.object({
  id: z.string(),
});

export const actions: Actions = {
  create: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });
    const { mode, subject, type, startDatetime, endDatetime, reason } =
      form.data;

    const created = await serverApi(event).POST(
      "/doors/{name}/access-policies",
      {
        params: { path: { name: params.slug } },
        body: {
          subject,
          type,
          mode,
          startDatetime: startDatetime
            ? dayjs.tz(startDatetime, "Europe/Stockholm").toISOString()
            : undefined,
          endDatetime: endDatetime
            ? dayjs.tz(endDatetime, "Europe/Stockholm").toISOString()
            : undefined,
          reason,
        },
      },
    );
    if (created.error)
      return setError(
        form,
        "subject",
        created.error.detail ?? m.admin_doors_memberOrRoleNotFound(),
      );

    return message(form, {
      message: m.admin_doors_ruleCreated(),
      type: "success",
    });
  },
  delete: async (event) => {
    const { request } = event;
    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    const deleted = await serverApi(event).DELETE(
      "/door-access-policies/{id}",
      { params: { path: { id } } },
    );
    if (deleted.error) throw new Error("Failed to remove door access policy");
    return message(form, {
      message: m.admin_doors_ruleDeleted(),
      type: "success",
    });
  },
};
