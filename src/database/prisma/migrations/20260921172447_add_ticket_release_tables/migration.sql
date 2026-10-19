-- CreateTable
CREATE TABLE "ticket_release" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "opens_at" TIMESTAMPTZ(6) NOT NULL,
    "grace_window_seconds" INTEGER NOT NULL DEFAULT 60,
    "offer_window_seconds" INTEGER NOT NULL DEFAULT 300,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_queue_entry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "release_id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "queue_position" INTEGER,
    "offer_expires_at" TIMESTAMPTZ(6),
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_queue_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_queue_entry_release_id_member_id_key" ON "ticket_queue_entry"("release_id", "member_id");

-- AddForeignKey
ALTER TABLE "ticket_queue_entry" ADD CONSTRAINT "ticket_queue_entry_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "ticket_release"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
