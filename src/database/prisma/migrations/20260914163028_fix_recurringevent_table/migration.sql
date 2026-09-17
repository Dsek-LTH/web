-- RenameTable
ALTER TABLE "RecurringEvent" RENAME TO "recurring_event";

-- RenameConstraint
ALTER TABLE "recurring_event" RENAME CONSTRAINT "RecurringEvent_pkey" TO "recurring_event_pkey";
