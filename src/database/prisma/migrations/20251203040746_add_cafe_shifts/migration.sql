-- CreateEnum
CREATE TYPE "time_slots" AS ENUM ('DAGIS', 'EARLY_1', 'EARLY_2', 'LATE');

-- CreateTable
CREATE TABLE "cafe_shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "workerId" UUID NOT NULL,
    "time_slot" "time_slots" NOT NULL,

    CONSTRAINT "cafe_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "date_timeslot_unique" ON "cafe_shifts"("date", "time_slot");

-- AddForeignKey
ALTER TABLE "cafe_shifts" ADD CONSTRAINT "worker_id_foreign" FOREIGN KEY ("workerId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
