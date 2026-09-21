-- Schema reference for sqlc's type generation only - never executed against
-- a real database. The actual tables are owned and migrated by Prisma
-- (src/database/schema.zmodel's TicketRelease/TicketQueueEntry models,
-- mapped to ticket_release/ticket_queue_entry), since this service is not
-- allowed to run its own migrations. Keep this in sync by hand whenever
-- those Prisma models change.

CREATE TABLE ticket_release (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL,
    opens_at TIMESTAMPTZ NOT NULL,
    closes_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    grace_window_seconds INTEGER NOT NULL DEFAULT 60,
    offer_window_seconds INTEGER NOT NULL DEFAULT 300,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- event_id references events(id), owned by Prisma - not declared as a
    -- foreign key here since sqlc only needs this file for column types,
    -- and the events table isn't part of this reference schema.
);

CREATE TABLE ticket_queue_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES ticket_release (id) ON DELETE CASCADE,
    member_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    queue_position INTEGER,
    offer_expires_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (release_id, member_id)
);
