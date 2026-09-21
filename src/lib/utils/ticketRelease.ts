import { z } from "zod";
import type { Infer } from "sveltekit-superforms";
import * as m from "$paraglide/messages";
import type { BadgeVariant } from "$lib/components/ui/badge/index.js";
import type { TicketQueueEntry } from "$lib/server/ticketService";

// opensAt/closesAt are local ISO datetime strings (no timezone), matching
// what a `datetime-local` input actually produces/accepts - binding those
// inputs directly to a `z.date()` field doesn't work (the browser needs a
// "YYYY-MM-DDTHH:mm" string, not a Date instance), same reason
// admin/doors/edit uses `z.iso.datetime({ local: true })` instead of
// `z.date()`. The server interprets these as Europe/Stockholm time.
export const ticketReleaseSchema = z
  .object({
    eventId: z.string().uuid(),
    title: z.string().min(1, "Title cannot be empty"),
    description: z.string().optional(),
    location: z.string().optional(),
    quantity: z.number().int("Quantity must be an integer").gt(0),
    opensAt: z.iso.datetime({ local: true }),
    closesAt: z.iso.datetime({ local: true }),
  })
  .refine((data) => data.closesAt > data.opensAt, {
    message: "Closing time must be after the opening time",
    path: ["closesAt"],
  });

export type TicketReleaseSchema = Infer<typeof ticketReleaseSchema>;

// EventID/opensAt aren't editable after publishing - see UpdateReleaseInput
// in ticket-service for why. Server-side validation (closesAt vs. the fixed
// opensAt/expiresAt) still applies and surfaces as a form error.
export const ticketReleaseEditSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  description: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().int("Quantity must be an integer").gt(0),
  closesAt: z.iso.datetime({ local: true }),
});

export type TicketReleaseEditSchema = Infer<typeof ticketReleaseEditSchema>;

export const ticketStatusLabel = (status: TicketQueueEntry["status"]) => {
  switch (status) {
    case "pending":
      return m.ticketRelease_status_pending();
    case "granted":
      return m.ticketRelease_status_granted();
    case "waitlisted":
      return m.ticketRelease_status_waitlisted();
    case "accepted":
      return m.ticketRelease_status_accepted();
    case "expired":
      return m.ticketRelease_status_expired();
    case "cancelled":
      return m.ticketRelease_status_cancelled();
  }
};

export const ticketStatusBadgeVariant = (
  status: TicketQueueEntry["status"],
): BadgeVariant => {
  switch (status) {
    case "accepted":
    case "granted":
      return "pistachio";
    case "pending":
    case "waitlisted":
      return "lila";
    case "expired":
    case "cancelled":
      return "outline";
  }
};

// The release itself only ever has one of these two statuses - "scheduled"
// (grace-window pooling hasn't ended yet) or "lottery_done" (the lottery has
// run, so new requests are granted or waitlisted immediately).
export type ReleaseStatus = "scheduled" | "lottery_done";

export const releaseStatusLabel = (status: string) => {
  switch (status as ReleaseStatus) {
    case "scheduled":
      return m.ticketRelease_releaseStatus_scheduled();
    case "lottery_done":
      return m.ticketRelease_releaseStatus_lottery_done();
    default:
      return status;
  }
};

export const releaseStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status as ReleaseStatus) {
    case "lottery_done":
      return "pistachio";
    case "scheduled":
    default:
      return "outline";
  }
};
